import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/lib/api';

import { deleteReview } from '../infrastructure/api/review-api';
import { useReviewStore } from '../store/use-review-store';

import { SPOTS_QUERY_KEY } from './use-spots';
import { SPOT_REVIEWS_QUERY_KEY } from './use-spot-reviews';

/**
 * 自分のレビューを backend で削除する mutation。
 *
 * 削除は `DELETE /api/v1/tourism/spots/:spotId/reviews/:reviewId`（認証必須 / #526）。
 * 成功したらローカルストア側の同 ID のレビューも除去する。{@link mergeReviews} は
 * ストア側を優先してマージするため、ストアから消さずに一覧クエリを無効化しただけでは
 * 再取得後も削除したレビューが復活してしまう。
 *
 * スポットの評価・レビュー件数はレビューとは別に取得しているため、削除成功時に
 * スポット側のクエリも無効化して再取得させる（#536）。平均やカウントをクライアント側で
 * 計算・減算すると backend の集計ロジックと食い違う恐れがあるため、再取得で合わせる。
 *
 * 404 は「すでに削除済み」として成功扱いにする。別端末で先に削除済み、または削除自体は
 * 成功したがレスポンス受信前に通信が切れた場合に、目的（削除）は達成済みなのに
 * 再試行しても永久に失敗し続けるのを防ぐため。
 */
export function useDeleteReview(spotId: string) {
  const deleteReviewInStore = useReviewStore((state) => state.deleteReview);
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (reviewId) => {
      try {
        await deleteReview(spotId, reviewId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return;
        throw error;
      }
    },
    onSuccess: (_data, reviewId) => {
      deleteReviewInStore(spotId, reviewId);
      void queryClient.invalidateQueries({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, spotId] });
      void queryClient.invalidateQueries({ queryKey: SPOTS_QUERY_KEY });
    },
  });
}
