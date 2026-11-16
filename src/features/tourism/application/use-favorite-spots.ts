import { useCallback, useMemo } from 'react';

import { useCurrentUser } from '@/features/user';

import { joinFavoriteSpots } from '../domain/favorite';

import { useFavorites } from './use-favorites';
import { useSpots } from './use-spots';

import type { Spot } from '../domain/spot';

export type UseFavoriteSpotsResult = {
  /** お気に入りのスポット（登録の新しい順）。未ログインなら空。取得前は undefined。 */
  data: Spot[] | undefined;
  isPending: boolean;
  isError: boolean;
  /** お気に入りとスポット一覧の両方を取り直す。 */
  refetch: () => Promise<void>;
};

const EMPTY: Spot[] = [];

/**
 * 自分のお気に入りを、表示用のスポットの形にして返す（#795）。
 *
 * お気に入り（`useFavorites`）は spotId しか持たないので、`useSpots()` のキャッシュから
 * ID で引き当てる。スポットの名前などは言語ごとにここで切り替わる。
 *
 * 未ログインのときは `useFavorites` が取りに行かず読み込み中のままになるため、
 * ここでは先に「空の一覧」として返す。
 */
export function useFavoriteSpots(): UseFavoriteSpotsResult {
  const isSignedIn = !!useCurrentUser();
  const favorites = useFavorites();
  const spots = useSpots();
  const { refetch: refetchFavorites } = favorites;
  const { refetch: refetchSpots } = spots;

  const data = useMemo(
    () =>
      favorites.data && spots.data ? joinFavoriteSpots(favorites.data, spots.data) : undefined,
    [favorites.data, spots.data],
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchFavorites(), refetchSpots()]);
  }, [refetchFavorites, refetchSpots]);

  if (!isSignedIn) {
    return { data: EMPTY, isPending: false, isError: false, refetch };
  }

  return {
    data,
    isPending: favorites.isPending || spots.isPending,
    isError: favorites.isError || spots.isError,
    refetch,
  };
}
