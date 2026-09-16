import { FALLBACK_LANGUAGE, type SupportedLanguage } from '@/shared/lib/i18n';

import type { Review } from '../../domain/review';

import type { MockSpotId } from './mock-spot-localizations';
import {
  MOCK_REVIEW_LOCALIZATIONS,
  type MockReviewId,
  type ReviewLocalization,
} from './mock-review-localizations';

type MockReviewBase = {
  id: MockReviewId;
  language: SupportedLanguage;
  rating: number;
  authorId: string;
  authorIconUrl: string;
  postedAt: string;
};

const MOCK_REVIEWS_BY_SPOT: Record<MockSpotId, MockReviewBase[]> = {
  'kobe-port-tower': [
    {
      id: 'kobe-port-tower-1',
      language: 'ja',
      rating: 5,
      authorId: 'user-12',
      authorIconUrl: 'https://i.pravatar.cc/150?img=12',
      postedAt: '2025-11-03T10:24:00.000Z',
    },
    {
      id: 'kobe-port-tower-2',
      language: 'en',
      rating: 4,
      authorId: 'user-45',
      authorIconUrl: 'https://i.pravatar.cc/150?img=45',
      postedAt: '2025-10-18T07:50:00.000Z',
    },
  ],
  'kitano-ijinkan': [
    {
      id: 'kitano-ijinkan-1',
      language: 'ko',
      rating: 4,
      authorId: 'user-33',
      authorIconUrl: 'https://i.pravatar.cc/150?img=33',
      postedAt: '2025-09-27T05:10:00.000Z',
    },
    {
      id: 'kitano-ijinkan-2',
      language: 'zh',
      rating: 5,
      authorId: 'user-23',
      authorIconUrl: 'https://i.pravatar.cc/150?img=23',
      postedAt: '2025-08-14T02:35:00.000Z',
    },
  ],
  nankinmachi: [
    {
      id: 'nankinmachi-1',
      language: 'ja',
      rating: 5,
      authorId: 'user-7',
      authorIconUrl: 'https://i.pravatar.cc/150?img=7',
      postedAt: '2025-12-01T11:05:00.000Z',
    },
    {
      id: 'nankinmachi-2',
      language: 'en',
      rating: 3,
      authorId: 'user-49',
      authorIconUrl: 'https://i.pravatar.cc/150?img=49',
      postedAt: '2025-11-22T08:42:00.000Z',
    },
  ],
  'arima-onsen': [
    {
      id: 'arima-onsen-1',
      language: 'ko',
      rating: 5,
      authorId: 'user-15',
      authorIconUrl: 'https://i.pravatar.cc/150?img=15',
      postedAt: '2025-10-09T13:18:00.000Z',
    },
    {
      id: 'arima-onsen-2',
      language: 'zh',
      rating: 4,
      authorId: 'user-27',
      authorIconUrl: 'https://i.pravatar.cc/150?img=27',
      postedAt: '2025-07-30T06:00:00.000Z',
    },
  ],
  'mount-rokko': [
    {
      id: 'mount-rokko-1',
      language: 'ja',
      rating: 5,
      authorId: 'user-51',
      authorIconUrl: 'https://i.pravatar.cc/150?img=51',
      postedAt: '2025-11-15T09:33:00.000Z',
    },
    {
      id: 'mount-rokko-2',
      language: 'en',
      rating: 4,
      authorId: 'user-60',
      authorIconUrl: 'https://i.pravatar.cc/150?img=60',
      postedAt: '2025-09-02T04:21:00.000Z',
    },
  ],
};

/** mock fetcher が模すネットワーク遅延（ミリ秒）。 */
const MOCK_LATENCY_MS = 300;

function isMockSpotId(spotId: string): spotId is MockSpotId {
  return spotId in MOCK_REVIEWS_BY_SPOT;
}

function resolveLocalization(
  language: SupportedLanguage,
  reviewId: MockReviewId,
): ReviewLocalization {
  return (
    MOCK_REVIEW_LOCALIZATIONS[language]?.[reviewId] ??
    MOCK_REVIEW_LOCALIZATIONS[FALLBACK_LANGUAGE][reviewId]
  );
}

function buildReview(base: MockReviewBase): Review {
  const localized = resolveLocalization(base.language, base.id);

  return {
    id: base.id,
    rating: { value: base.rating },
    comment: localized.comment,
    author: {
      id: base.authorId,
      name: localized.authorName,
      iconUrl: base.authorIconUrl,
    },
    postedAt: base.postedAt,
    language: base.language,
  };
}

/**
 * 指定スポットに投稿されたレビュー一覧を取得する。
 *
 * 現状は mock データを返すが、Sprint 2 で実 REST API 呼び出しに差し替える。
 * その際もこの `fetchReviews(spotId, language): Promise<Review[]>` というシグネチャを維持することで、
 * application / ui 層を変更せずに実装だけを入れ替えられる。
 * 未知のスポット ID には空配列を返す。
 */
export async function fetchReviews(spotId: string): Promise<Review[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  if (!isMockSpotId(spotId)) {
    return [];
  }

  return MOCK_REVIEWS_BY_SPOT[spotId].map(buildReview);
}
