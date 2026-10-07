import type { PublicUser } from '@/features/user';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { SpotRating } from './spot-rating';

/** 観光スポットに投稿されたユーザーレビュー。 */
export type Review = {
  id: string;
  rating: SpotRating;
  comment: string;
  author: PublicUser;
  /** ISO 8601 形式の文字列。 */
  postedAt: string;
  language: SupportedLanguage;
};
