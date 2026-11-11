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

// NFKC で全角英数・半角カタカナ等を正準形に統一してから小文字化し、表記の違いを吸収する。
function normalizeForSearch(value: string): string {
  return value.normalize('NFKC').toLowerCase().trim();
}

/**
 * スポット一覧を名前の部分一致で絞り込む純粋関数。
 * 大文字・小文字、全角・半角は区別しない。キーワードが空（空白のみ含む）なら全件を返す。
 */
export function filterSpotsByKeyword(spots: Spot[], keyword: string): Spot[] {
  const normalizedKeyword = normalizeForSearch(keyword);
  if (normalizedKeyword === '') return spots;
  return spots.filter((spot) => normalizeForSearch(spot.name).includes(normalizedKeyword));
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
