import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/user/application/use-current-user';

import { addFavorite, removeFavorite } from '../infrastructure/api/favorite-api';

import { FAVORITES_QUERY_KEY, favoritesQueryKey } from './use-favorites';

import type { Favorite } from '../domain/favorite';

export type ToggleFavoriteVariables = {
  spotId: string;
  /** 押したあとの状態。true なら追加、false なら削除。 */
  next: boolean;
};

type ToggleFavoriteContext = {
  previous: Favorite[] | undefined;
};

const TOGGLE_FAVORITE_MUTATION_KEY = [...FAVORITES_QUERY_KEY, 'toggle'] as const;

/**
 * お気に入りを追加・削除する（#790）。
 *
 * 押したらすぐ一覧のキャッシュを書き換え（楽観的更新）、失敗したら元に戻す。
 * 「反転して」ではなく押したあとの状態 `next` を受け取るのは、連打したときに
 * 古い状態から反転して結果が逆になるのを防ぐため（API は冪等なので最後の操作が勝つ）。
 *
 * 未ログイン時は API を呼ばずに失敗する。ログインの案内はボタン側で出す（#796）。
 */
export function useToggleFavorite() {
  const userId = useCurrentUser()?.id;
  const queryClient = useQueryClient();
  const queryKey = favoritesQueryKey(userId);

  return useMutation<void, Error, ToggleFavoriteVariables, ToggleFavoriteContext>({
    mutationKey: TOGGLE_FAVORITE_MUTATION_KEY,
    mutationFn: async ({ spotId, next }) => {
      if (!userId) {
        throw new Error('未ログインのためお気に入りを変更できません');
      }
      await (next ? addFavorite(spotId) : removeFavorite(spotId));
    },
    onMutate: async ({ spotId, next }) => {
      if (!userId) return { previous: undefined };

      // 取得中の一覧が後から届いて、書き換えた見た目を上書きしないよう止める。
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Favorite[]>(queryKey);
      queryClient.setQueryData<Favorite[]>(queryKey, (old = []) => {
        const others = old.filter((favorite) => favorite.spotId !== spotId);
        return next ? [{ spotId, createdAt: new Date().toISOString() }, ...others] : others;
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (!userId || !context) return;
      queryClient.setQueryData<Favorite[]>(queryKey, context.previous);
    },
    onSettled: () => {
      if (!userId) return;
      // ほかのスポットの操作がまだ途中なら取り直さない。途中で取り直すと、
      // まだ終わっていない操作の見た目が一瞬元に戻ってちらつくため。最後の 1 件が終わったときに揃える。
      if (queryClient.isMutating({ mutationKey: TOGGLE_FAVORITE_MUTATION_KEY }) === 1) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
