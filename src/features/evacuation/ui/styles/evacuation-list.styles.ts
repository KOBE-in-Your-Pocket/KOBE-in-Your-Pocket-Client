import { Platform, StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const CATEGORY_COLOR = '#3A6EA5';
/** 施設カテゴリの文字色。ダークでは {@link CATEGORY_COLOR} だと黒地で読みにくいため明るい青にする。 */
export const CATEGORY_TEXT_COLOR = { light: CATEGORY_COLOR, dark: '#7FB0E6' } as const;
/** 最寄りバッジ専用のアクセントカラー（避難モードの赤）。 */
export const NEAREST_BADGE_COLOR = '#EF4444';
/**
 * 位置情報フォールバックバナーの配色。ライトは淡い赤地に濃い赤字、ダークは淡い赤地が浮かないよう
 * 半透明の赤を敷き、文字は明るい赤にする。
 */
export const LOCATION_BANNER_COLORS = {
  light: { background: '#FDECEA', text: '#B71C1C' },
  dark: { background: 'rgba(239, 68, 68, 0.18)', text: '#FF8A80' },
} as const;

export const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  headerless: {
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  locationBanner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  filterEmpty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    rowGap: Spacing.one,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nearestBadge: {
    backgroundColor: NEAREST_BADGE_COLOR,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  nearestBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  address: {
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
