import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import {
  resolveEmailSignInErrorKind,
  resolveEmailSignUpErrorKind,
  useEmailSignIn,
  useEmailSignUp,
} from '../../application/use-email-auth';
import { useGoogleSignIn } from '../../application/use-google-sign-in';

/** プライマリアクションの配色（位置情報モーダルのアクセントカラーに合わせる）。 */
const ACCENT_COLOR = '#C67B4A';

/** backend（GoTrue）のパスワード最小長。 */
const MIN_PASSWORD_LENGTH = 6;

export type SignInModalProps = {
  /** モーダルの表示有無。 */
  visible: boolean;
  /** 閉じる操作（サインイン完了・「閉じる」押下・端末の戻る操作）時のコールバック。 */
  onClose: () => void;
};

type AuthMode = 'signIn' | 'signUp';

/**
 * サインイン用モーダル。
 * Google サインインとメールアドレス + パスワードのログイン / 新規登録をまとめて提供する。
 * いずれかの方法でセッションが確立したら onClose を呼ぶ。
 */
export function SignInModal({ visible, onClose }: SignInModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /** 新規登録後にメール確認待ちであることを知らせる表示。 */
  const [confirmationSent, setConfirmationSent] = useState(false);

  const googleSignIn = useGoogleSignIn();
  const emailSignIn = useEmailSignIn();
  const emailSignUp = useEmailSignUp();

  const isPending = googleSignIn.isPending || emailSignIn.isPending || emailSignUp.isPending;

  const canSubmit =
    email.trim().length > 0 &&
    (mode === 'signIn'
      ? password.length > 0
      : password.length >= MIN_PASSWORD_LENGTH && name.trim().length > 0);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmationSent(false);
    emailSignIn.reset();
    emailSignUp.reset();
    googleSignIn.reset();
  };

  const closeWith = (didSignIn: boolean) => {
    if (didSignIn || !isPending) {
      resetForm();
      setMode('signIn');
      onClose();
    }
  };

  const switchMode = (next: AuthMode) => {
    if (next === mode) {
      return;
    }
    setMode(next);
    setConfirmationSent(false);
    emailSignIn.reset();
    emailSignUp.reset();
  };

  const handleGoogleSignIn = () => {
    // 前回のメール認証エラーが残ったまま表示されないようにする。
    emailSignIn.reset();
    emailSignUp.reset();
    googleSignIn.mutate(undefined, {
      onSuccess: (session) => {
        // キャンセル時は null が返るのでモーダルは開いたままにする。
        if (session) {
          closeWith(true);
        }
      },
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || isPending) {
      return;
    }

    // 前回の Google サインインエラーが残ったまま表示されないようにする。
    googleSignIn.reset();

    const trimmedEmail = email.trim();
    if (mode === 'signIn') {
      emailSignIn.mutate(
        { email: trimmedEmail, password },
        { onSuccess: (session) => session && closeWith(true) },
      );
    } else {
      emailSignUp.mutate(
        { email: trimmedEmail, password, name: name.trim() },
        {
          onSuccess: (result) => {
            if (result?.status === 'session') {
              closeWith(true);
              return;
            }
            if (result?.status === 'confirmationRequired') {
              // メール確認待ち: ログインタブへ切り替えて案内を表示する。
              emailSignUp.reset();
              setPassword('');
              setMode('signIn');
              setConfirmationSent(true);
            }
          },
        },
      );
    }
  };

  const errorMessage = resolveErrorMessage({
    mode,
    signInError: emailSignIn.error,
    signUpError: emailSignUp.error,
    googleError: googleSignIn.isError,
    t,
  });

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => closeWith(false)}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ThemedView type="background" style={styles.card}>
          {/* キーボード表示時や小画面・大きな文字でも送信/閉じるまで到達できるようにスクロール可能にする */}
          <ScrollView
            contentContainerStyle={styles.cardContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="subtitle" style={styles.title}>
              {t('auth.title')}
            </ThemedText>

            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Light}
              disabled={isPending}
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
            />

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.backgroundElement }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {t('auth.or')}
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.backgroundElement }]} />
            </View>

            <View style={styles.tabs}>
              {(['signIn', 'signUp'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  accessibilityRole="button"
                  onPress={() => switchMode(tab)}
                  style={[
                    styles.tab,
                    { backgroundColor: mode === tab ? ACCENT_COLOR : theme.backgroundElement },
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={mode === tab ? styles.activeTabText : undefined}
                    themeColor={mode === tab ? undefined : 'textSecondary'}
                  >
                    {t(tab === 'signIn' ? 'auth.signInTab' : 'auth.signUpTab')}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {mode === 'signUp' ? (
              <TextInput
                style={inputStyle}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
                editable={!isPending}
              />
            ) : null}
            <TextInput
              style={inputStyle}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              editable={!isPending}
            />
            <TextInput
              style={inputStyle}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete={mode === 'signIn' ? 'password' : 'password-new'}
              secureTextEntry
              editable={!isPending}
            />

            {confirmationSent ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('auth.confirmationEmailSent')}
              </ThemedText>
            ) : null}

            {errorMessage ? (
              <ThemedText type="small" themeColor="textSecondary">
                {errorMessage}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit || isPending}
              onPress={handleSubmit}
              style={[styles.submitButton, (!canSubmit || isPending) && styles.disabledButton]}
            >
              <ThemedText type="default" style={styles.submitButtonText}>
                {t(mode === 'signIn' ? 'auth.submitSignIn' : 'auth.submitSignUp')}
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => closeWith(false)}
              style={styles.closeButton}
            >
              <ThemedText type="default" themeColor="textSecondary">
                {t('auth.close')}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * 認証エラーをモードに応じたユーザー向けメッセージへ変換する。
 * エラー内容の解釈（種別分類）は application 層に委ね、UI は種別 → 文言の対応のみ持つ。
 */
function resolveErrorMessage({
  mode,
  signInError,
  signUpError,
  googleError,
  t,
}: {
  mode: AuthMode;
  signInError: unknown;
  signUpError: unknown;
  googleError: boolean;
  t: (key: string) => string;
}): string | null {
  if (googleError) {
    return t('settings.signInError');
  }

  if (mode === 'signIn' && signInError) {
    switch (resolveEmailSignInErrorKind(signInError)) {
      case 'emailNotConfirmed':
        return t('auth.emailNotConfirmed');
      case 'invalidCredentials':
        return t('auth.invalidCredentials');
      case 'unknown':
        return t('settings.signInError');
    }
  }

  if (mode === 'signUp' && signUpError) {
    switch (resolveEmailSignUpErrorKind(signUpError)) {
      case 'emailRateLimited':
        return t('auth.emailRateLimited');
      case 'unknown':
        return t('auth.signUpError');
    }
  }

  return null;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    borderRadius: Spacing.three,
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  googleButton: {
    width: '100%',
    height: 48,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  input: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  submitButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: Spacing.two,
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
