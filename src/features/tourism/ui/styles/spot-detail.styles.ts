import { Platform, StyleSheet } from 'react-native';

import { SMALL_TEXT_LINE_HEIGHT, Spacing } from '@/shared/config';

import { touchHitSlop } from './favorite-button.styles';

export const CATEGORY_COLOR = '#C67B4A';
export const RATING_STAR_COLOR = '#F5A623';
/** 経路案内ボタンの背景色（各コンテンツ・ピンカードで共通の紫）。 */
export const ROUTE_BUTTON_COLOR = '#8B5CF6';
/** お気に入りマークのアイコンサイズ（#794）。地の上に単独で置くため既定の 16 より大きくする。 */
export const FAVORITE_ICON_SIZE = 24;
/**
 * hitSlop は押せる範囲を広げるが、RN は親 View の境界までしか広げない
 * （https://reactnative.dev/docs/view#hitslop）。評価が無いスポットでは
 * metaTrailing がアイコンと同じ大きさまで縮むため、この分を自身の余白として確保する。
 */
const FAVORITE_HIT_SLOP = touchHitSlop(FAVORITE_ICON_SIZE);

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  content: {
    paddingBottom: Spacing.five,
  },
  hero: {
    position: 'relative',
    height: 260,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: 260,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.three,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexShrink: 0,
    // 広げた分（padding）を負のマージンで相殺し、見た目の位置・大きさは変えない。
    padding: FAVORITE_HIT_SLOP,
    margin: -FAVORITE_HIT_SLOP,
  },
  category: {
    color: CATEGORY_COLOR,
    fontSize: 13,
    fontWeight: '600',
    // 長いカテゴリ名でもお気に入りマークを画面外に押し出さないよう、縮む側に回す。
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
  },
  description: {
    lineHeight: 22,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  addressIcon: {
    height: SMALL_TEXT_LINE_HEIGHT,
    justifyContent: 'center',
  },
  addressText: {
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
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    // flex:1 の左右区切り線に押されて長い訳文がはみ出さないよう、見出し側を縮小可能にする。
    flexShrink: 1,
  },
  // サブタイトルの左右に薄い区切り線を入れる行（ホームのタイトル区切り線と同じ 1dp・textSecondary）。
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionTitleDivider: {
    flex: 1,
    height: 1,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  sectionValue: {
    lineHeight: 22,
  },
  reviewCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  reviewAuthor: {
    flex: 1,
  },
  reviewComment: {
    lineHeight: 20,
  },
});
