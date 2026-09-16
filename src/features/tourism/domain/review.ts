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
