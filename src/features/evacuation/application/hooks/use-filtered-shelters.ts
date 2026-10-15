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
 * `totalCount` は絞り込み前の件数（取得前は undefined）。絞り込みで 0 件になったのか、
 * そもそも避難所が無いのかを UI で出し分けるために返す。選択状態は画面をまたいで残るため、
 * 選択の有無ではなく元データの件数で判定する。
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
    totalCount: sheltersQuery.data?.length,
  };
}
