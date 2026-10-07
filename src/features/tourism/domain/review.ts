import type { PublicUser } from '@/features/user';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { SpotRating } from './spot-rating';

/**
 * 観光スポットに投稿されたユーザーレビュー。
 */
export type Review = {
  /** レビューの一意 ID（編集対象の特定に使用）。 */
  id: string;
  /** 星評価（1〜5）。 */
  rating: SpotRating;
  /** コメント本文。 */
  comment: string;
  /** 投稿者の公開プロフィール。 */
  author: PublicUser;
  /** 投稿日時（ISO 8601 形式の文字列）。 */
  postedAt: string;
  /** レビューの言語（言語別フィルタに使用）。 */
  language: SupportedLanguage;
};

/**
 * author.id 未返却時のフォールバック値。
 *
 * backend はレビュー一覧で author_user_id を返すが、V17 以前に投稿され
 * author_user_id が NULL のまま残るレビューだけは id が欠ける（#490）。
 * その場合にこの値で補う（実ユーザー ID と衝突しない空文字）。
 */
export const UNKNOWN_AUTHOR_ID = '';

/**
 * 投稿者を特定できるレビューか（author_user_id が返っているか）。
 *
 * false のレビューは誰の投稿か特定できず本人判定ができないため、
 * 通報など「本人ではないこと」を前提とする操作の導線を出してはいけない（#490）。
 */
export function hasIdentifiedAuthor(review: Review): boolean {
  return review.author.id !== UNKNOWN_AUTHOR_ID;
}
