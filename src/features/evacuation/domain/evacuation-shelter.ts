export type ShelterCoordinates = {
  latitude: number;
  longitude: number;
};

/** 災害対策基本法上の区分（指定緊急避難場所 / 指定避難所 / 兼用）。 */
export type ShelterType = 'emergency' | 'designated' | 'both';

/** 施設種別（一覧カードのカテゴリ表示用）。 */
export type ShelterFacilityCategory = 'government' | 'school' | 'park' | 'gymnasium';

/** 避難所のメディア情報。 */
export type ShelterMedia = {
  imageUrl: string;
};

/** 避難所のドメインモデル。一覧・詳細で共通利用するフィールド。 */
export type EvacuationShelter = {
  id: string;
  name: string;
  address: string;
  coordinates: ShelterCoordinates;
  type: ShelterType;
  /** 施設種別（UI カテゴリ表示用キー）。 */
  facilityCategory: ShelterFacilityCategory;
  media: ShelterMedia;
  /** 収容可能人数。無い場合は undefined。 */
  capacity?: number;
  /** バリアフリー対応可否。 */
  accessible: boolean;
  /** 開設状況の参考となる外部ページ（自治体の避難所情報ページ等）。無い場合は undefined。 */
  externalUrl?: string;
};
