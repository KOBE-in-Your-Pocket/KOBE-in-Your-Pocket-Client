import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedView } from '@/shared/ui';

import { AccountSection } from './account-section';
import { LanguageSelector } from './language-selector';

/**
 * 設定画面のヘッダー。
 *
 * 装飾タイトルは置かず、右端にハンバーガーメニューのボタンだけを置く（どの画面かは下のタブで分かる）。
 * 押下すると「このアプリについて」画面（`/settings/about`）へ遷移する（#771）。
 */
function SettingsHeader() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.headerRow}>
      <Pressable
        style={[styles.menuButton, { backgroundColor: theme.backgroundElement }]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('settings.menu')}
        onPress={() => router.push('/settings/about')}
      >
        <SymbolView
          tintColor={theme.text}
          name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }}
          size={20}
        />
      </Pressable>
    </View>
  );
}

export function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <SettingsHeader />
          {/* 親PBI のタイトル「メイン＝アカウント＋言語」に合わせ、アカウント情報を上・言語選択を下に並べる（#828）。 */}
          <AccountSection />
          <LanguageSelector />
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
    // タイトルが無く右上はメニューボタンだけなので、上の余白は小さめにする。
    paddingTop: Spacing.two,
    // 項目が増えてタブバーの下に潜らないようスクロールさせる。
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  // メニューボタンだけを右端に置く行。
  headerRow: {
    alignItems: 'flex-end',
  },
  // 地図右上のハンバーガーボタンと同じ 40dp 円形のアイコンボタン。
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
