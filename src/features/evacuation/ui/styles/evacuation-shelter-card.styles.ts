import { Platform, StyleSheet } from 'react-native';

import { BottomTabInset, Spacing } from '@/shared/config';

/** 詳細ボタンのアクセントカラー（避難モードの赤。モードトグル・ホームと統一）。 */
export const CARD_ACCENT_COLOR = '#EF4444';
/** 経路案内ボタンの背景色（観光・避難のカードで共通の紫）。 */
export const NAV_BUTTON_COLOR = '#8B5CF6';

export const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: BottomTabInset + Spacing.three,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  imageWrapper: {
    position: 'relative',
    height: 160,
    justifyContent: 'flex-end',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContent: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  category: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  footer: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  address: {
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  detailButton: {
    borderWidth: 1,
    borderColor: CARD_ACCENT_COLOR,
    backgroundColor: 'transparent',
  },
  detailButtonText: {
    color: CARD_ACCENT_COLOR,
    fontWeight: '700',
  },
  navButton: {
    backgroundColor: NAV_BUTTON_COLOR,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
