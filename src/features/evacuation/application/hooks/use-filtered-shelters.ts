import { useMemo } from 'react';

import { useDisasterFilterStore } from '../../store/use-disaster-filter-store';
import { filterSheltersByDisaster } from '../use-cases/filter-shelters-by-disaster';

import { useEvacuationShelters } from './use-evacuation-shelters';

/**
 * 選択中の災害種別で絞り込んだ避難所一覧を返す application 層フック。
 *
 * 取得は {@link useEvacuationShelters}（ローカル SQLite）に委譲し、selectedDisasters で
 * クライアント側フィルタする。通信なしで動く。
 *
 * `isFiltered` は災害種別を 1 つ以上選んでいるかどうか。絞り込みで 0 件になったのか、
 * そもそも避難所が無いのかを UI で出し分けるために返す。
 */
export function useFilteredShelters() {
  const selectedDisasters = useDisasterFilterStore((state) => state.selectedDisasters);
  const sheltersQuery = useEvacuationShelters();

  const data = useMemo(() => {
    if (!sheltersQuery.data) return sheltersQuery.data;
    return filterSheltersByDisaster(sheltersQuery.data, selectedDisasters);
  }, [sheltersQuery.data, selectedDisasters]);

  return {
    ...sheltersQuery,
    data,
    isFiltered: selectedDisasters.length > 0,
  };
}
