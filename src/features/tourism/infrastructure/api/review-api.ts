import type { PublicUser } from '@/features/user';
import { apiFetch } from '@/shared/lib/api';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import { UNKNOWN_AUTHOR_ID, type Review } from '../../domain/review';

/**
 * Backend が返すレビュー author。
 *
 * backend はレビュー一覧で author_user_id（id）と name を返すが、V17 以前に投稿され
 * author_user_id が NULL のまま残るレビューだけは id が欠ける（#490）。
 * iconUrl は現状返さないため、どちらも欠落に備えて任意項目として受ける。
 */
type ReviewAuthorResponse = {
  name: string;
  id?: string | null;
  iconUrl?: string | null;
};

/** Backend `GET .../reviews` のレスポンス要素。author 以外は {@link Review} 型と互換。 */
type ReviewResponse = Omit<Review, 'author'> & {
  author: ReviewAuthorResponse;
};

/** author.iconUrl 未返却時のフォールバック。空文字にすると UserAvatar がプレースホルダを表示する。 */
const FALLBACK_AUTHOR_ICON_URL = '';

/**
 * Backend レスポンス（author.id / iconUrl が欠けうる）をドメインの {@link Review}（author は PublicUser）へ変換する。
 * id は欠けていれば {@link UNKNOWN_AUTHOR_ID} で補い（本人判定不可として扱う / #490）、
 * iconUrl は空文字で補って UI 側のプレースホルダ表示に委ねる。
 */
function toReview(dto: ReviewResponse): Review {
  return {
    ...dto,
    author: {
      id: dto.author.id ?? UNKNOWN_AUTHOR_ID,
      name: dto.author.name,
      iconUrl: dto.author.iconUrl ?? FALLBACK_AUTHOR_ICON_URL,
    },
  };
}

/**
 * 指定スポットに投稿されたレビュー一覧を取得する。
 *
 * バックエンド `GET /api/v1/tourism/spots/:spotId/reviews` を呼び出し、指定言語で
 * 解決済みのレビュー一覧を返す。author は name のみ返るため {@link toReview} でドメイン型へ変換する。
 * 該当スポットにレビューが無ければ空配列が返る。
 */
export async function fetchReviews(spotId: string, language: SupportedLanguage): Promise<Review[]> {
  const response = await apiFetch<ReviewResponse[]>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews`,
    { query: { lang: language } },
  );

  return response.map(toReview);
}

/** 投稿するレビューの内容。 */
export type ReviewInput = {
  rating: { value: number };
  comment: string;
  language: SupportedLanguage;
};

/**
 * レビューを投稿する。
 *
 * バックエンド `POST /api/v1/tourism/spots/:spotId/reviews` を呼び出す（認証必須 / #506）。
 * backend はレスポンスの author に id を返さないが、投稿は自分のものなので
 * ログイン中のユーザーで補う（{@link fetchReviews} の空文字フォールバックとは違い、
 * 投稿直後の一覧で「自分のレビュー」として扱えるようにするため）。
 */
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
        // backend は author.name を必須・iconUrl を任意で受け取る（未設定は null）。
        author: { name: author.name, iconUrl: author.iconUrl || null },
        language: input.language,
      },
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

/** 編集で変更できるレビューの内容。 */
export type ReviewUpdate = {
  rating: { value: number };
  comment: string;
};

/**
 * 自分のレビューを編集する。
 *
 * バックエンド `PUT /api/v1/tourism/spots/:spotId/reviews/:reviewId` を呼び出す（認証必須 / #506）。
 * 言語は投稿時のものが維持されるため送らない（backend の `ReviewUpdateRequest` は
 * rating / comment のみ受け取る）。author の補完は {@link postReview} と同じ理由で
 * ログイン中のユーザーを使う。
 */
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

/**
 * 自分のレビューを削除する。
 *
 * バックエンド `DELETE /api/v1/tourism/spots/:spotId/reviews/:reviewId` を呼び出す（認証必須 / #526）。
 */
export async function deleteReview(spotId: string, reviewId: string): Promise<void> {
  await apiFetch<void>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews/${encodeURIComponent(reviewId)}`,
    { method: 'DELETE', auth: true },
  );
}

/**
 * 他人のレビューを不適切として通報する（#538）。
 *
 * バックエンド `POST /api/v1/tourism/spots/:spotId/reviews/:reviewId/reports` を呼び出す（認証必須）。
 * 通報理由やカテゴリは UI で収集しないためボディは送らず、対象はパスで指定する。
 * 受理の成否は {@link apiFetch} の共通処理に委ねる（非 2xx は {@link ApiError}、204 は void）。
 */
export async function reportReview(spotId: string, reviewId: string): Promise<void> {
  await apiFetch<void>(
    `/api/v1/tourism/spots/${encodeURIComponent(spotId)}/reviews/${encodeURIComponent(reviewId)}/reports`,
    { method: 'POST', auth: true },
  );
}
