import { useMemo } from 'react';

import { useGenreFilterStore } from '../store/use-genre-filter-store';

import { useSpots } from './use-spots';

import type { Spot } from '../domain/spot';
import type { SelectedGenre } from '../store/use-genre-filter-store';

/**
 * スポット一覧を selectedGenre で絞り込む純粋関数。
 * 'all' のときは全件をそのまま返す。
 */
export function filterSpotsByGenre(spots: Spot[], genre: SelectedGenre): Spot[] {
  if (genre === 'all') return spots;
  return spots.filter((spot) => spot.genre === genre);
}

/**
 * 選択中ジャンルで絞り込んだ観光スポット一覧を返す application 層フック。
 *
 * 取得は {@link useSpots}（実 API）に委譲し、selectedGenre でクライアント側フィルタする。
 * 'all' のときは全件を返す。
 */
export function useFilteredSpots() {
  const selectedGenre = useGenreFilterStore((state) => state.selectedGenre);
  const spotsQuery = useSpots();

  const data = useMemo(() => {
    if (!spotsQuery.data) return spotsQuery.data;
    return filterSpotsByGenre(spotsQuery.data, selectedGenre);
  }, [spotsQuery.data, selectedGenre]);

  return {
    ...spotsQuery,
    data,
  };
}
