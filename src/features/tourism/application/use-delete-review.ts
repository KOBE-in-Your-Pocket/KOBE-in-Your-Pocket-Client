import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteReview } from '../infrastructure/api/review-api';
import { useReviewStore } from '../store/use-review-store';

import { SPOT_REVIEWS_QUERY_KEY } from './use-spot-reviews';

/**
 * 自分のレビューを backend で削除する mutation。
 *
 * 削除は `DELETE /api/v1/tourism/spots/:spotId/reviews/:reviewId`（認証必須 / #526）。
 * 成功したらローカルストア側の同 ID のレビューも除去する。{@link mergeReviews} は
 * ストア側を優先してマージするため、ストアから消さずに一覧クエリを無効化しただけでは
 * 再取得後も削除したレビューが復活してしまう。
 */
export function useDeleteReview(spotId: string) {
  const deleteReviewInStore = useReviewStore((state) => state.deleteReview);
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (reviewId) => deleteReview(spotId, reviewId),
    onSuccess: (_data, reviewId) => {
      deleteReviewInStore(spotId, reviewId);
      void queryClient.invalidateQueries({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, spotId] });
    },
  });
}
