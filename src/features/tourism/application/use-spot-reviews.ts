import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { fetchReviews } from '../infrastructure/api/review-api';
import { useReviewStore } from '../store/use-review-store';

import type { Review } from '../domain/review';

export const SPOT_REVIEWS_QUERY_KEY = ['tourism', 'spot-reviews'] as const;

const EMPTY_REVIEWS: Review[] = [];

/**
 * サーバー取得分（seed）とローカル投稿分（submitted）を結合し、投稿日時の新しい順に並べる。
 *
 * 投稿・編集の結果は再取得が届くまでの間もローカルストアに載るため、実 API 取得分に
 * ユーザー自身の投稿を重ねることで、投稿直後でも一覧から消えないようにする。
 *
 * 投稿・編集がサーバー採番の ID を持つレビューをストアへ積むようになった（#411）ため、
 * 再取得後は seed と submitted に同じ ID が並ぶ。ID で重複を排除しないと React の
 * 一覧が同じ key を 2 つ持つことになるので、Map でまとめて submitted を優先する
 * （編集直後は submitted 側が新しい内容を持つ）。
 */
export function mergeReviews(seed: Review[], submitted: Review[]): Review[] {
  const byId = new Map<string, Review>();
  for (const item of seed) {
    byId.set(item.id, item);
  }
  for (const item of submitted) {
    byId.set(item.id, item);
  }

  return [...byId.values()].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

export function useSpotReviews(spotId: string | null | undefined) {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);

  const seedQuery = useQuery<Review[]>({
    queryKey: [...SPOT_REVIEWS_QUERY_KEY, spotId, language],
    enabled: Boolean(spotId),
    queryFn: () => fetchReviews(spotId as string, language),
  });

  const submitted = useReviewStore((state) =>
    spotId ? (state.submittedReviews[spotId] ?? EMPTY_REVIEWS) : EMPTY_REVIEWS,
  );

  const data = useMemo(
    () => mergeReviews(seedQuery.data ?? EMPTY_REVIEWS, submitted),
    [seedQuery.data, submitted],
  );

  return { data, isPending: seedQuery.isPending, isError: seedQuery.isError };
}
