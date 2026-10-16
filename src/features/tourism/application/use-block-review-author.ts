import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/user/application/use-current-user';

import { blockReviewAuthor } from '../infrastructure/api/review-api';
import { useBlockedAuthorStore } from '../store/use-blocked-author-store';

import { SPOT_REVIEWS_QUERY_KEY } from './use-spot-reviews';

/**
 * レビューの投稿者をブロックする（#663）。App Store Guideline 1.2 の「悪質なユーザーの
 * ブロック」に当たる。
 *
 * 成功したら端末にも記録して、再取得を待たずに全スポットからその投稿者のレビューを消す。
 * あわせて全スポットの一覧を古い扱いにし、次の取得でサーバー側の除外に揃える。
 */
export function useBlockReviewAuthor() {
  const blocker = useCurrentUser();
  const markBlocked = useBlockedAuthorStore((state) => state.markBlocked);
  const queryClient = useQueryClient();

  return useMutation<void, Error, { authorId: string }>({
    mutationFn: async ({ authorId }) => {
      if (!blocker) {
        throw new Error('未ログインのためユーザーをブロックできません');
      }
      await blockReviewAuthor(authorId);
    },
    onSuccess: (_data, { authorId }) => {
      if (blocker) markBlocked(blocker.id, authorId);
      void queryClient.invalidateQueries({ queryKey: SPOT_REVIEWS_QUERY_KEY });
    },
  });
}
