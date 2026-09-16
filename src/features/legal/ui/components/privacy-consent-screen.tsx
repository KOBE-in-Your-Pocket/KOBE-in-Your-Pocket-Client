import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ADULT_AGE_THRESHOLD } from '../../domain/age-restriction';
import { privacyPolicyUrl } from '../../domain/privacy-policy';

import { MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

/** プライマリアクションの配色（サインインモーダルのアクセントカラーに合わせる）。 */
const ACCENT_COLOR = '#C67B4A';

/** どちらの選択肢を保存中か。押した側だけにスピナーを出すために持つ。 */
type SavingChoice = 'adult' | 'minor' | null;

export type PrivacyConsentScreenProps = {
  /**
   * 同意ボタンの押下。{@link ADULT_AGE_THRESHOLD} 歳以上として同意したかを渡す。
   * 保存に失敗した場合は reject する。
   */
  onAccept: (isAdult: boolean) => Promise<void>;
};

/**
 * 初回起動時に表示する同意画面。
 *
 * 同意するまでアプリ本体へ進めないブロッキング画面のため、閉じる導線は持たない。
 *
 * 年齢は「閾値以上かどうか」だけを尋ねる。生年月日を入力させると、回避したいはずの
 * 子供の個人情報そのものを集めることになるため。どちらを選んでも観光・避難所・マナーの
 * 閲覧はできるので、未成年の選択肢を選びにくく見せない。
 */
export function PrivacyConsentScreen({ onAccept }: PrivacyConsentScreenProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const [savingChoice, setSavingChoice] = useState<SavingChoice>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const isSaving = savingChoice !== null;

  const openPolicy = async () => {
    await openBrowserAsync(privacyPolicyUrl(i18n.language), {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  const accept = async (isAdult: boolean) => {
    if (isSaving) {
      return;
    }

    setSavingChoice(isAdult ? 'adult' : 'minor');
    setHasFailed(false);
    try {
      await onAccept(isAdult);
    } catch {
      setHasFailed(true);
    } finally {
      setSavingChoice(null);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">{t('common.appName')}</ThemedText>
          <ThemedText type="subtitle">{t('legal.consent.title')}</ThemedText>
          <ThemedText>{t('legal.consent.description')}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {t('legal.consent.ageNotice', { age: ADULT_AGE_THRESHOLD })}
          </ThemedText>

          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void openPolicy();
            }}
            style={[styles.policyLink, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText style={styles.policyLinkLabel}>{t('legal.consent.readPolicy')}</ThemedText>
          </Pressable>

          {hasFailed ? (
            <ThemedText style={styles.error}>{t('legal.consent.saveError')}</ThemedText>
          ) : null}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving }}
          disabled={isSaving}
          onPress={() => {
            void accept(true);
          }}
          style={[styles.acceptButton, isSaving && styles.buttonDisabled]}
        >
          {savingChoice === 'adult' ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.acceptLabel}>
              {t('legal.consent.acceptAdult', { age: ADULT_AGE_THRESHOLD })}
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving }}
          disabled={isSaving}
          onPress={() => {
            void accept(false);
          }}
          style={[styles.minorButton, isSaving && styles.buttonDisabled]}
        >
          {savingChoice === 'minor' ? (
            <ActivityIndicator color={ACCENT_COLOR} />
          ) : (
            <ThemedText style={styles.minorLabel}>
              {t('legal.consent.acceptMinor', { age: ADULT_AGE_THRESHOLD })}
            </ThemedText>
          )}
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  policyLink: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  policyLinkLabel: {
    color: ACCENT_COLOR,
  },
  error: {
    color: '#D64545',
  },
  acceptButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  minorButton: {
    borderColor: ACCENT_COLOR,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  acceptLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  minorLabel: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
});
