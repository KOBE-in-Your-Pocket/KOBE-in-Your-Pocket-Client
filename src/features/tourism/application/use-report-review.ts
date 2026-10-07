import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/user/application/use-current-user';
import { ApiError } from '@/shared/lib/api';

import { reportReview, type ReviewReportInput } from '../infrastructure/api/review-api';
import { useReportedReviewStore } from '../store/use-reported-review-store';

import { SPOT_REVIEWS_QUERY_KEY } from './use-spot-reviews';

export type ReportOutcome = 'reported' | 'notFound';

export function useReportReview(spotId: string) {
  const reporter = useCurrentUser();
  const markReported = useReportedReviewStore((state) => state.markReported);
  const queryClient = useQueryClient();

  return useMutation<ReportOutcome, Error, { reviewId: string } & ReviewReportInput>({
    mutationFn: async ({ reviewId, ...input }) => {
      if (!reporter) {
        throw new Error('未ログインのためレビューを通報できません');
      }
      try {
        await reportReview(spotId, reviewId, input);
        return 'reported';
      } catch (error) {
        // 409 は同じ人が通報済み。通報自体は届いているので成功扱いにする。
        if (error instanceof ApiError && error.status === 409) return 'reported';
        if (error instanceof ApiError && error.status === 404) return 'notFound';
        throw error;
      }
    },
    onSuccess: (outcome, { reviewId }) => {
      if (reporter) markReported(reporter.id, reviewId);
      if (outcome === 'notFound') {
        void queryClient.invalidateQueries({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, spotId] });
      }
    },
  });
}
