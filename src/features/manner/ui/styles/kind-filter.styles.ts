import { FILTER_NEUTRAL_COLOR } from './filter-group.styles';

import type { SelectedKind } from '@/features/manner';

/**
 * カテゴリー選択タブの選択時カラー。
 * 「全て」は中立グレー、ルールは黄色、マナーは緑で、種別ごとに色分けする。
 */
export const KIND_SELECTED_COLOR: Record<SelectedKind, string> = {
  all: FILTER_NEUTRAL_COLOR,
  rule: '#EAB308',
  manner: '#22C55E',
};
