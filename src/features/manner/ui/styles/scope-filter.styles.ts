import { FILTER_NEUTRAL_COLOR } from './filter-group.styles';

import type { SelectedScope } from '@/features/manner';

/**
 * 対象選択タブの選択時カラー。
 * 「全て」は中立グレー、各所・全国は青で色分けする。
 */
export const SCOPE_SELECTED_COLOR: Record<SelectedScope, string> = {
  all: FILTER_NEUTRAL_COLOR,
  local: '#3B82F6',
  japan: '#3B82F6',
};
