import type { SpotCategory } from './spot-category';
import type { SpotMedia } from './spot-media';
import type { SpotRating } from './spot-rating';

/**
 * 観光スポットのジャンル区分。
 * 実 API 導入後もこの区分を契約として共有する。
 */
export type SpotGenre = 'landmark' | 'nature' | 'history' | 'gourmet' | 'onsen';

export type SpotCoordinates = {
  latitude: number;
  longitude: number;
};

/**
 * 観光スポットのドメインモデル。
 */
export type Spot = {
  id: string;
  name: string;
  genre: SpotGenre;
  description: string;
  address: string;
  coordinates: SpotCoordinates;
  businessHours: string;
  category: SpotCategory;
  media: SpotMedia;
  /**
   * 評価情報。データが無い場合は `undefined`（UI 側で非表示）。
   * 実評価はバックエンド導入後に付与する想定。
   */
  rating?: SpotRating;
  /**
   * 閲覧数（全期間の合計、#836）。backend は詳細 API（`GET /api/v1/tourism/spots/{id}`）でだけ返し、
   * 一覧には含めない。取れていないとき（一覧のキャッシュを仮表示している間など）は `undefined` で、
   * UI 側は表示しない。閲覧がまだ無いスポットは `0`。
   */
  viewCount?: number;
};
