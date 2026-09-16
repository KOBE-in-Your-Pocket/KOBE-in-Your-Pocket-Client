import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AboutSection } from '@/features/legal';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/config';
import { ThemedText, ThemedView } from '@/shared/ui';

import { AccountSection } from './account-section';
import { LanguageSelector } from './language-selector';

export function SettingsScreen() {
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">{t('tabs.settings')}</ThemedText>
          <LanguageSelector />
          <AccountSection />
          <AboutSection />
        </ScrollView>
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
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    // 項目が増えてタブバーの下に潜らないようスクロールさせる。
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
});
