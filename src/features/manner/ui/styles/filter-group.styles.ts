import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 見出しバッジ（カテゴリー / 対象）の背景色（オレンジ）。 */
export const FILTER_BADGE_COLOR = '#F97316';

/**
 * 中立グレー。「全て」タブの選択色と、非選択タブの文字色に共用する。
 * 各絞り込みの選択色マップ（kind-filter.styles / scope-filter.styles）からも参照する。
 */
export const FILTER_NEUTRAL_COLOR = '#6B7280';

/** 非選択タブの背景（淡いグレー）。選択タブは各選択色で塗る。 */
const FILTER_TAG_BACKGROUND = '#F3F4F6';

/** 選択グループを囲う枠線の色（淡いグレー）。一覧カードと区別するための外枠。 */
const FILTER_GROUP_BORDER = '#E5E7EB';

export const styles = StyleSheet.create({
  // 見出しバッジ（1行目）とタブ行（2行目）を中央揃えで縦に積む1グループ分のコンテナ。
  // 枠線で囲み、下の一覧カードや隣のグループと視覚的に区別する。
  group: {
    marginTop: Spacing.two,
    gap: Spacing.one,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: FILTER_GROUP_BORDER,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  badge: {
    backgroundColor: FILTER_BADGE_COLOR,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // 個別タブを間隔を空けて横並び（中央揃え・折り返しあり）にし、連結して見えないようにする。
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    backgroundColor: FILTER_TAG_BACKGROUND,
  },
  // 選択タブの背景色はコンポーネントで選択色に上書きする。
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: FILTER_NEUTRAL_COLOR,
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
});
