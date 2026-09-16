import { useMemo } from 'react';

import {
  filterMannersByKind,
  filterMannersByScope,
} from '../../application/use-cases/filter-manners';
import { useKindFilterStore } from '../../store/use-kind-filter-store';
import { useScopeFilterStore } from '../../store/use-scope-filter-store';

import { useManners } from './use-manners';

/**
 * 選択中の種別（selectedKind）・地域スコープ（selectedScope）で絞り込んだマナー項目一覧を返す UI hook。
 *
 * {@link useManners} の取得結果に {@link filterMannersByKind} と {@link filterMannersByScope} を
 * 両方適用する（AND 条件）。それぞれ 'all' のときは絞り込まない。ローディング・エラー等の状態は
 * useManners のものをそのまま引き継ぐ。
 */
export function useFilteredManners() {
  const query = useManners();
  const selectedKind = useKindFilterStore((state) => state.selectedKind);
  const selectedScope = useScopeFilterStore((state) => state.selectedScope);

  const data = useMemo(() => {
    if (query.data === undefined) return undefined;
    return filterMannersByScope(filterMannersByKind(query.data, selectedKind), selectedScope);
  }, [query.data, selectedKind, selectedScope]);

  return { ...query, data };
}
