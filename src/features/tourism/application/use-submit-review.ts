import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '@/features/user/application/use-current-user';
import { resolveLanguage } from '@/shared/lib/i18n';

import { postReview } from '../infrastructure/api/review-api';
import { useReviewStore, type ReviewEdit } from '../store/use-review-store';

import { SPOT_REVIEWS_QUERY_KEY } from './use-spot-reviews';

import type { Review } from '../domain/review';

/**
 * レビューを backend へ投稿する mutation。
 *
 * 投稿は `POST /api/v1/tourism/spots/:spotId/reviews`（認証必須）。成功したら
 * サーバーが採番した ID を持つレビューをローカルストアにも積み、一覧クエリを
 * 無効化して再取得する。ストアへ積むのは、再取得が完了するまでの間や取得が
 * まだ mock seed の間でも投稿直後の 1 件が一覧から消えないようにするため
 * （`mergeReviews` が id で重複を排除するので、再取得後も二重表示にはならない）。
 *
 * 未ログイン時は投稿者を確定できないため、mutation はエラーで終了する。
 */
export function useSubmitReview(spotId: string) {
  const { i18n } = useTranslation();
  const author = useCurrentUser();
  const addReview = useReviewStore((state) => state.addReview);
  const queryClient = useQueryClient();

  return useMutation<Review, Error, ReviewEdit>({
    mutationFn: async (input) => {
      if (!author) {
        throw new Error('未ログインのためレビューを投稿できません');
      }

      return postReview(spotId, { ...input, language: resolveLanguage(i18n.language) }, author);
    },
    onSuccess: (review) => {
      addReview(spotId, review);
      // 一覧クエリのキーは [..., spotId, language]。language を省いた前方一致で無効化し、
      // 別言語でキャッシュ済みの一覧にも新しい投稿が反映されるようにする。
      void queryClient.invalidateQueries({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, spotId] });
    },
  });
}
