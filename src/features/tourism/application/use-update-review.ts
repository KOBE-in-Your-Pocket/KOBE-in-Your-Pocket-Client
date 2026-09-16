import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/user/application/use-current-user';

import { updateReview } from '../infrastructure/api/review-api';
import { useReviewStore, type ReviewEdit } from '../store/use-review-store';

import { SPOT_REVIEWS_QUERY_KEY } from './use-spot-reviews';

import type { Review } from '../domain/review';

/** 編集対象のレビューと変更内容。 */
export type ReviewUpdateVariables = {
  reviewId: string;
  changes: ReviewEdit;
};

/**
 * 自分のレビューを backend で更新する mutation。
 *
 * 更新は `PUT /api/v1/tourism/spots/:spotId/reviews/:reviewId`（認証必須）。
 * 成功したらローカルストア側の同 ID のレビューも書き換え、一覧クエリを無効化して
 * 再取得する（{@link useSubmitReview} と同じく、再取得が届くまでの間も編集結果が
 * 一覧に反映されているようにするため）。
 *
 * 未ログイン時は編集者を確定できないため、mutation はエラーで終了する。
 */
export function useUpdateReview(spotId: string) {
  const author = useCurrentUser();
  const updateReviewInStore = useReviewStore((state) => state.updateReview);
  const queryClient = useQueryClient();

  return useMutation<Review, Error, ReviewUpdateVariables>({
    mutationFn: async ({ reviewId, changes }) => {
      if (!author) {
        throw new Error('未ログインのためレビューを編集できません');
      }

      return updateReview(spotId, reviewId, changes, author);
    },
    onSuccess: (review) => {
      updateReviewInStore(spotId, review.id, {
        rating: review.rating,
        comment: review.comment,
      });
      // 一覧クエリのキーは [..., spotId, language]。language を省いた前方一致で無効化し、
      // 別言語でキャッシュ済みの一覧にも編集結果が反映されるようにする。
      void queryClient.invalidateQueries({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, spotId] });
    },
  });
}
