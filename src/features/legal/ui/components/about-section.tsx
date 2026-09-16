import { router } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { privacyPolicyUrl } from '../../domain/privacy-policy';
import { SUPPORT_CONTACT_URL } from '../../domain/support-contact';
import { getAppVersion } from '../../infrastructure/app-version';

import { LegalRow } from './legal-row';

import { Spacing } from '@/shared/config';
import { ThemedText } from '@/shared/ui';

/**
 * 設定画面の「このアプリについて」欄。
 *
 * App Store 提出に必要な導線をまとめる: プライバシーポリシー（Guideline 5.1.1）、
 * クレジット（OSM / ORS の帰属表示・データ出典）、問い合わせ窓口（Guideline 1.2）、
 * バージョン表示。
 */
export function AboutSection() {
  const { t, i18n } = useTranslation();
  const version = getAppVersion();

  const openUrl = (url: string) => {
    void openBrowserAsync(url, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {t('settings.about')}
      </ThemedText>
      <View style={styles.list}>
        <LegalRow
          label={t('settings.privacyPolicy')}
          accessibilityRole="link"
          onPress={() => openUrl(privacyPolicyUrl(i18n.language))}
        />
        <LegalRow label={t('settings.credits')} onPress={() => router.push('/settings/credits')} />
        <LegalRow
          label={t('settings.contact')}
          accessibilityRole="link"
          onPress={() => openUrl(SUPPORT_CONTACT_URL)}
        />
        {version !== null ? <LegalRow label={t('settings.version')} value={version} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
});
