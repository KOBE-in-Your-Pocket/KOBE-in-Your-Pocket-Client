import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/user/application/use-current-user';

import { fetchFavorites } from '../infrastructure/api/favorite-api';

import type { Favorite } from '../domain/favorite';

/** お気に入り系クエリのキー名前空間。実際のキーは `[...FAVORITES_QUERY_KEY, userId]`。 */
export const FAVORITES_QUERY_KEY = ['tourism', 'favorites'] as const;

/** ユーザーごとのお気に入り一覧のキー。別のアカウントに切り替えてもキャッシュが混ざらない。 */
export function favoritesQueryKey(userId: string | undefined) {
  return [...FAVORITES_QUERY_KEY, userId] as const;
}

/**
 * 自分のお気に入り一覧（新しい順）を取得する（#790）。
 *
 * 未ログインのときは取りに行かず、`data` は `undefined` のまま。
 */
export function useFavorites() {
  const userId = useCurrentUser()?.id;

  return useQuery<Favorite[]>({
    queryKey: favoritesQueryKey(userId),
    queryFn: fetchFavorites,
    enabled: !!userId,
  });
}

/**
 * そのスポットがお気に入りか。未ログイン・取得前は false。
 *
 * 一覧のキャッシュを探すだけなので、ボタンがいくつあっても通信は 1 回で済む。
 */
export function useIsFavorite(spotId: string): boolean {
  const { data } = useFavorites();
  return data?.some((favorite) => favorite.spotId === spotId) ?? false;
}
