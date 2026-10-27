import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/**
 * カテゴリ表示のアクセントカラー（避難所ピン・カードの緑と統一）。
 * ダークでは濃い緑だと黒地に沈むため、同系の明るい緑にする。
 */
export const DETAIL_ACCENT_COLOR = { light: '#0F8A4F', dark: '#34C77B' } as const;
/** 外部リンク（テキスト・アイコン）の色（避難モードの赤）。 */
export const EXTERNAL_LINK_COLOR = '#EF4444';
/** 経路案内ボタンの背景色（各コンテンツ・ピンカードで共通の紫）。 */
export const ROUTE_BUTTON_COLOR = '#8B5CF6';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  backButtonRow: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  infoText: {
    flex: 1,
  },
  routeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: ROUTE_BUTTON_COLOR,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  linkText: {
    flex: 1,
    color: EXTERNAL_LINK_COLOR,
    fontWeight: '600',
  },
});
