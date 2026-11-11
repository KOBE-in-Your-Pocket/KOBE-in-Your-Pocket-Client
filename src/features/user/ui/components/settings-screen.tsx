import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { PixelRatio, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AboutSection } from '@/features/legal';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { AccountSection } from './account-section';
import { LanguageSelector } from './language-selector';

/**
 * 設定画面のヘッダー。
 *
 * 一覧画面（マナー）・ホーム画面と同じ装飾タイトル（中央寄せ・上下区切り線）に揃え、
 * 右端にハンバーガーメニューのボタンを重ねる。押下時の遷移（「このアプリについて」画面）は
 * 別タスクで対応するため、ここでは表示とアクセシビリティ属性のみを用意する。
 */
function SettingsHeader() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.titleRow}>
      <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
      <ThemedText type="title" style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        {t('tabs.settings')}
      </ThemedText>
      <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
      <View style={styles.menuButtonWrap}>
        <Pressable
          style={[styles.menuButton, { backgroundColor: theme.backgroundElement }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('settings.menu')}
        >
          <SymbolView
            tintColor={theme.text}
            name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }}
            size={20}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
          <SettingsHeader />
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
  // マナー一覧・ホームと同じ装飾タイトル行：中央寄せタイトルを上下の区切り線で挟む。
  // メニューボタンを右端に重ねるため relative にする。
  titleRow: {
    position: 'relative',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  // タイトルを上下で挟む区切り線（一覧画面・ホーム画面と同一スタイル）。
  divider: {
    height: PixelRatio.roundToNearestPixel(1),
    alignSelf: 'stretch',
  },
  // 一覧画面・ホーム画面と同じ装飾タイトル（筆記体・中央揃え・fontSize 30 / lineHeight 40）。
  title: {
    fontFamily: Fonts.cursive,
    fontWeight: 'normal',
    fontSize: 30,
    lineHeight: 40,
    textAlign: 'center',
  },
  // メニューボタンはタイトル行の右端に重ね、中央のタイトル＋区切り線は画面中央に保つ。
  // top/bottom:0 ＋ justifyContent:center でタイトル行の高さに対して縦中央に置く。
  menuButtonWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
