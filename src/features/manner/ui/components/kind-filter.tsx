import { useTranslation } from 'react-i18next';

import { useKindFilterStore } from '../../store/use-kind-filter-store';

import { KIND_SELECTED_COLOR } from '../styles/kind-filter.styles';

import type { SelectedKind } from '@/features/manner';

import { FilterGroup } from './filter-group';

/** 「カテゴリー」絞り込みの選択肢と表示順（全て・ルール・マナー）。 */
const KINDS: SelectedKind[] = ['all', 'rule', 'manner'];

/**
 * マナー一覧の「カテゴリー」絞り込み。
 *
 * 見出しバッジ「カテゴリー」＋タグ（全て / ルール / マナー）を {@link FilterGroup} で表示し、
 * 選択値を `useKindFilterStore` の selectedKind に反映する。
 */
export function KindFilter() {
  const { t } = useTranslation();
  const { selectedKind, setSelectedKind } = useKindFilterStore();

  const options = KINDS.map((kind) => ({
    value: kind,
    label: t(`manner.kindFilter.${kind}`),
    selectedColor: KIND_SELECTED_COLOR[kind],
  }));

  return (
    <FilterGroup
      label={t('manner.filter.category')}
      options={options}
      selected={selectedKind}
      onSelect={setSelectedKind}
    />
  );
}
