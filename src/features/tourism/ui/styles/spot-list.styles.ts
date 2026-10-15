import { Platform, StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const CATEGORY_COLOR = '#C67B4A';
export const RATING_STAR_COLOR = '#F5A623';
/** 経路案内ボタンの背景色（各コンテンツ・ピンカードで共通の紫）。 */
export const ROUTE_BUTTON_COLOR = '#8B5CF6';

export const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  // iOS では overflow: 'hidden' を指定した View の影はクリップされて表示されないため、
  // 影は外側の card、角丸の切り抜きは内側の cardInner に分けて指定する。
  card: {
    borderRadius: Spacing.three,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.26,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  cardInner: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  distanceBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  distanceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    color: CATEGORY_COLOR,
    fontSize: 13,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  name: {
    fontSize: 18,
    lineHeight: 24,
  },
  description: {
    lineHeight: 20,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  routeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
    backgroundColor: ROUTE_BUTTON_COLOR,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
