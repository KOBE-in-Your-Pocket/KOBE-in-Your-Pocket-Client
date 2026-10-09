import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { fetchReviews, type SpotReviews } from '../infrastructure/api/review-api';
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
 *
 * `hiddenReviewIds`（通報が運営に承認されたレビュー）は submitted 側にあっても除く。
 */
export function mergeReviews(
  seed: Review[],
  submitted: Review[],
  hiddenReviewIds: readonly string[] = [],
): Review[] {
  const byId = new Map<string, Review>();
  for (const item of seed) {
    byId.set(item.id, item);
  }
  for (const item of submitted) {
    byId.set(item.id, item);
  }
  // 運営が通報を承認したレビューは、端末内に残る本人の投稿分でも出さない（#583）。
  for (const id of hiddenReviewIds) {
    byId.delete(id);
  }

  return [...byId.values()].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

/**
 * サーバーは投稿時点の表示名・アイコンをスナップショットのまま保持し、プロフィール変更後も
 * 更新しない（#547）。自分（`author.id` 一致）のレビューだけ、保存値ではなく今の
 * `currentUser` の name / iconUrl を使う。他人の端末からの見え方は直せない。
 */
export function applyCurrentUserAuthorInfo(
  reviews: Review[],
  currentUser: Review['author'] | null,
): Review[] {
  if (!currentUser) return reviews;

  return reviews.map((review) =>
    review.author.id !== '' && review.author.id === currentUser.id
      ? {
          ...review,
          author: { ...review.author, name: currentUser.name, iconUrl: currentUser.iconUrl },
        }
      : review,
  );
}

export function useSpotReviews(
  spotId: string | null | undefined,
  currentUser: Review['author'] | null,
) {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);

  const seedQuery = useQuery<SpotReviews>({
    queryKey: [...SPOT_REVIEWS_QUERY_KEY, spotId, language],
    enabled: Boolean(spotId),
    queryFn: () => fetchReviews(spotId as string, language),
  });

  const submitted = useReviewStore((state) =>
    spotId ? (state.submittedReviews[spotId] ?? EMPTY_REVIEWS) : EMPTY_REVIEWS,
  );

  const merged = useMemo(
    () =>
      mergeReviews(
        seedQuery.data?.reviews ?? EMPTY_REVIEWS,
        submitted,
        seedQuery.data?.hiddenReviewIds,
      ),
    [seedQuery.data, submitted],
  );

  const data = useMemo(
    () => applyCurrentUserAuthorInfo(merged, currentUser),
    [merged, currentUser],
  );

  return {
    data,
    isPending: seedQuery.isPending,
    isError: seedQuery.isError,
    refetch: seedQuery.refetch,
  };
}
