import { useTranslation } from 'react-i18next';

import { useScopeFilterStore } from '../../store/use-scope-filter-store';

import { SCOPE_SELECTED_COLOR } from '../styles/scope-filter.styles';

import type { SelectedScope } from '@/features/manner';

import { FilterGroup } from './filter-group';

/** 「対象」絞り込みの選択肢と表示順（全て・各所・全国）。 */
const SCOPES: SelectedScope[] = ['all', 'local', 'japan'];

/**
 * マナー一覧の「対象」絞り込み。
 *
 * 見出しバッジ「対象」＋タグ（全て / 各所 / 全国）を {@link FilterGroup} で表示し、
 * 選択値を `useScopeFilterStore` の selectedScope に反映する。
 */
export function ScopeFilter() {
  const { t } = useTranslation();
  const { selectedScope, setSelectedScope } = useScopeFilterStore();

  const options = SCOPES.map((scope) => ({
    value: scope,
    label: t(`manner.scopeFilter.${scope}`),
    selectedColor: SCOPE_SELECTED_COLOR[scope],
  }));

  return (
    <FilterGroup
      label={t('manner.filter.target')}
      options={options}
      selected={selectedScope}
      onSelect={setSelectedScope}
    />
  );
}
