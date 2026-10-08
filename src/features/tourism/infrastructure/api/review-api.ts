import type { PublicUser } from '@/features/user';
import { apiFetch } from '@/shared/lib/api';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { ReportReason } from '../../domain/report-reason';
import type { Review } from '../../domain/review';

type ReviewAuthorResponse = {
  name: string;
  id?: string | null;
  iconUrl?: string | null;
};

type ReviewResponse = Omit<Review, 'author'> & {
  author: ReviewAuthorResponse;
};

/** GET の 1 件。POST / PUT の応答には `hiddenByReport` が載らない。 */
type ReviewListItemResponse = ReviewResponse & {
  /** 通報が運営に承認された口コミか。true ならアプリ全体で表示しない。古い Backend ではキーが無い。 */
  hiddenByReport?: boolean;
};

/** スポットのレビュー取得結果。非表示のレビューは本文を持ち出さず、ID だけ返す。 */
export type SpotReviews = {
  reviews: Review[];
  /** 通報が運営に承認されたレビューの ID。端末内に残る本人の投稿からも除くために使う。 */
  hiddenReviewIds: string[];
};

// id は実ユーザーと衝突しない空文字、iconUrl は空文字で UserAvatar のプレースホルダ表示に委ねる。
const FALLBACK_AUTHOR_ID = '';
const FALLBACK_AUTHOR_ICON_URL = '';

function toReview(dto: ReviewResponse): Review {
  return {
    ...dto,
    author: {
      id: dto.author.id ?? FALLBACK_AUTHOR_ID,
      name: dto.author.name,
      iconUrl: dto.author.iconUrl ?? FALLBACK_AUTHOR_ICON_URL,
    },
  };
}

/**
 * `GET /api/v1/tourism/spots/:spotId/reviews`。該当スポットにレビューが無ければ空配列。
 * 通報が承認された口コミ（`hiddenByReport`）は `reviews` から外し、ID だけを返す。
 */
export async function fetchReviews(
  spotId: string,
  language: SupportedLanguage,
): Promise<SpotReviews> {
  const response = await apiFetch<ReviewListItemResponse[]>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews`,
    { query: { lang: language } },
  );

  const reviews: Review[] = [];
  const hiddenReviewIds: string[] = [];
  for (const { hiddenByReport, ...dto } of response) {
    if (hiddenByReport) {
      hiddenReviewIds.push(dto.id);
    } else {
      reviews.push(toReview(dto));
    }
  }

  return { reviews, hiddenReviewIds };
}

export type ReviewInput = {
  rating: { value: number };
  comment: string;
  language: SupportedLanguage;
};

/** `POST /api/v1/tourism/spots/:spotId/reviews`（認証必須）。 */
export async function postReview(
  spotId: string,
  input: ReviewInput,
  author: PublicUser,
): Promise<Review> {
  const response = await apiFetch<ReviewResponse>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews`,
    {
      method: 'POST',
      auth: true,
      body: {
        rating: input.rating.value,
        comment: input.comment,
        author: { name: author.name, iconUrl: author.iconUrl || null },
        language: input.language,
      },
    },
  );

  // backend は author.id を返さないため、投稿直後に「自分のレビュー」と扱えるよう当人で補う。
  return {
    ...toReview(response),
    author: {
      id: author.id,
      name: response.author.name,
      iconUrl: response.author.iconUrl ?? author.iconUrl,
    },
  };
}

export type ReviewUpdate = {
  rating: { value: number };
  comment: string;
};

/** `PUT /api/v1/tourism/spots/:spotId/reviews/:reviewId`（認証必須）。言語は投稿時のものが保たれるため送らない。 */
export async function updateReview(
  spotId: string,
  reviewId: string,
  update: ReviewUpdate,
  author: PublicUser,
): Promise<Review> {
  const response = await apiFetch<ReviewResponse>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews/${encodeURIComponent(reviewId)}`,
    {
      method: 'PUT',
      auth: true,
      body: { rating: update.rating.value, comment: update.comment },
    },
  );

  return {
    ...toReview(response),
    author: {
      id: author.id,
      name: response.author.name,
      iconUrl: response.author.iconUrl ?? author.iconUrl,
    },
  };
}

/** `DELETE /api/v1/tourism/spots/:spotId/reviews/:reviewId`（認証必須）。 */
export async function deleteReview(spotId: string, reviewId: string): Promise<void> {
  await apiFetch<void>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews/${encodeURIComponent(reviewId)}`,
    { method: 'DELETE', auth: true },
  );
}

export type ReviewReportInput = {
  reason: ReportReason;
  description: string;
};

/** `POST /api/v1/tourism/spots/:spotId/reviews/:reviewId/reports`（認証必須）。 */
export async function reportReview(
  spotId: string,
  reviewId: string,
  input: ReviewReportInput,
): Promise<void> {
  const description = input.description.trim();
  await apiFetch<unknown>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews/${encodeURIComponent(reviewId)}/reports`,
    {
      method: 'POST',
      auth: true,
      body: description === '' ? { reason: input.reason } : { reason: input.reason, description },
    },
  );
}
