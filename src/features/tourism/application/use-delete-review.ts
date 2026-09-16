import { useCallback } from 'react';

import { useReviewStore } from '../store/use-review-store';

export function useDeleteReview(spotId: string) {
  const deleteReview = useReviewStore((state) => state.deleteReview);

  return useCallback((reviewId: string) => deleteReview(spotId, reviewId), [spotId, deleteReview]);
}
