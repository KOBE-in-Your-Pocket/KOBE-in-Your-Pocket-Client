import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CREDIT_ATTRIBUTIONS, type Attribution } from '../../domain/attributions';

import { MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

/** 帰属表示のラベル色（同意画面・サインインモーダルのアクセントカラーに合わせる）。 */
const ACCENT_COLOR = '#C67B4A';

function AttributionLink({ attribution }: { attribution: Attribution }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={attribution.label}
      onPress={() => {
        void openBrowserAsync(attribution.url, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      {/* ライセンス上そのまま表示する必要がある文字列なので翻訳しない。 */}
      <ThemedText type="default" style={styles.attributionLabel}>
        {attribution.label}
      </ThemedText>
      <SymbolView
        name={{ ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' }}
        tintColor={theme.textSecondary}
        size={14}
      />
    </Pressable>
  );
}

/**
 * クレジット画面。
 *
 * 経路データは OpenRouteService 経由の OpenStreetMap 由来であり、ODbL が成果物への
 * 帰属表示を求めるため、アプリ内に恒久的な表示場所を用意する。地図画面にも経路表示中の
 * 帰属表示を出しているが、こちらは経路の有無に関わらず参照できる。
 */
export function CreditsScreen() {
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

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">{t('settings.credits')}</ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary">
            {t('legal.credits.mapAndRouting')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('legal.credits.mapAndRoutingDescription')}
          </ThemedText>
          {CREDIT_ATTRIBUTIONS.map((attribution) => (
            <AttributionLink key={attribution.url} attribution={attribution} />
          ))}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionSpacing}>
            {t('legal.credits.evacuationData')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('legal.credits.evacuationDataDescription')}
          </ThemedText>
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
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  attributionLabel: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  sectionSpacing: {
    marginTop: Spacing.three,
  },
});
