import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/config';
import { useColorScheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { useAppleSignIn, useIsAppleSignInAvailable } from '../../application/use-apple-sign-in';
import { useGoogleSignIn } from '../../application/use-google-sign-in';

/** SSO ボタン（Apple / Google）の高さ。両者を同じ大きさで並べる（HIG）。 */
const SSO_BUTTON_HEIGHT = 48;

export type SignInModalProps = {
  /** モーダルの表示有無。 */
  visible: boolean;
  /** 閉じる操作（サインイン完了・「閉じる」押下・端末の戻る操作）時のコールバック。 */
  onClose: () => void;
};

/**
 * サインイン用モーダル。
 * Apple サインイン（iOS のみ）・Google サインインを提供する。
 * メールアドレス + パスワード認証はメール確認が機能しておらず任意のアドレスで登録できてしまうため、
 * 一旦 UI から外している（application / infrastructure 層の実装は復活用に残す）。
 * いずれかの方法でセッションが確立したら onClose を呼ぶ。
 */
export function SignInModal({ visible, onClose }: SignInModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  const isAppleSignInAvailable = useIsAppleSignInAvailable();
  const appleSignIn = useAppleSignIn();
  const googleSignIn = useGoogleSignIn();

  const isPending = appleSignIn.isPending || googleSignIn.isPending;

  const closeWith = (didSignIn: boolean) => {
    if (didSignIn || !isPending) {
      appleSignIn.reset();
      googleSignIn.reset();
      onClose();
    }
  };

  const handleAppleSignIn = () => {
    if (isPending) {
      return;
    }

    // 前回の Google サインインのエラーが残ったまま表示されないようにする。
    googleSignIn.reset();
    appleSignIn.mutate(undefined, {
      onSuccess: (session) => {
        // キャンセル時は null が返るのでモーダルは開いたままにする。
        if (session) {
          closeWith(true);
        }
      },
    });
  };

  const handleGoogleSignIn = () => {
    // 前回の Apple サインインのエラーが残ったまま表示されないようにする。
    appleSignIn.reset();
    googleSignIn.mutate(undefined, {
      onSuccess: (session) => {
        // キャンセル時は null が返るのでモーダルは開いたままにする。
        if (session) {
          closeWith(true);
        }
      },
    });
  };

  const hasError = appleSignIn.isError || googleSignIn.isError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => closeWith(false)}
    >
      <View style={styles.backdrop}>
        <ThemedView type="background" style={styles.card}>
          {/* 小画面・大きな文字でも閉じるまで到達できるようにスクロール可能にする */}
          <ScrollView
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText type="subtitle" style={styles.title}>
              {t('auth.title')}
            </ThemedText>

            {isAppleSignInAvailable ? (
              // AppleAuthenticationButton は disabled を持たないため、送信中は外側で操作を止める。
              <View
                pointerEvents={isPending ? 'none' : 'auto'}
                style={isPending ? styles.disabledButton : undefined}
              >
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={
                    colorScheme === 'dark'
                      ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                      : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                  }
                  cornerRadius={Spacing.two}
                  onPress={handleAppleSignIn}
                  style={styles.appleButton}
                />
              </View>
            ) : null}

            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Light}
              disabled={isPending}
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
            />

            {hasError ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('settings.signInError')}
              </ThemedText>
            ) : null}

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
      </View>
    </Modal>
  );
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
  appleButton: {
    width: '100%',
    height: SSO_BUTTON_HEIGHT,
  },
  googleButton: {
    width: '100%',
    height: SSO_BUTTON_HEIGHT,
  },
  disabledButton: {
    opacity: 0.5,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
