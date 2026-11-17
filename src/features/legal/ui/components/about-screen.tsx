import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AboutSection } from './about-section';

import { MaxContentWidth, Spacing } from '@/shared/config';
import { ThemedText, ThemedView } from '@/shared/ui';

/** 戻るラベル色（クレジット画面・同意画面のアクセントカラーに合わせる）。 */
const ACCENT_COLOR = '#C67B4A';

/**
 * 「このアプリについて」画面（`/settings/about`）。
 *
 * これまで設定画面に直接並べていた {@link AboutSection}（利用規約・プライバシーポリシー・
 * クレジット・問い合わせ・バージョン）を、設定画面のハンバーガーメニューから開く別画面へ
 * 移したもの（#771）。導線自体は AboutSection をそのまま再利用しているため変わらない。
 * ルートの Stack はヘッダー非表示なので、クレジット画面と同じ自前の戻る導線を用意する。
 */
export function AboutScreen() {
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/settings');
            }
          }}
          hitSlop={Spacing.two}
          style={styles.backRow}
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={ACCENT_COLOR}
            size={18}
          />
          <ThemedText style={styles.backLabel}>{t('common.back')}</ThemedText>
        </Pressable>

        {/* AboutSection が自前で「このアプリについて」の見出しを描画するため、画面側では
            タイトルを重ねず AboutSection をそのまま置く（#771・導線と表示は従来どおり）。 */}
        <ScrollView contentContainerStyle={styles.content}>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingBottom: Spacing.two,
  },
  backLabel: {
    color: ACCENT_COLOR,
  },
  content: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
});
