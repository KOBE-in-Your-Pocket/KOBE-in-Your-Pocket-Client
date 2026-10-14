export type ShelterCoordinates = {
  latitude: number;
  longitude: number;
};

/** 災害対策基本法上の区分（指定緊急避難場所 / 指定避難所 / 兼用）。 */
export type ShelterType = 'emergency' | 'designated' | 'both';

/** 施設種別（一覧カードのカテゴリ表示用）。 */
export type ShelterFacilityCategory = 'government' | 'school' | 'park' | 'gymnasium';

/** 避難所の適否を判定する災害種別（神戸市オープンデータの区分のうち backend が返すもの）。 */
export const DISASTER_TYPES = ['landslide', 'flood', 'tsunami', 'large-fire'] as const;
export type DisasterType = (typeof DISASTER_TYPES)[number];

/**
 * ある災害種別に対する避難所の適否。
 * - `suitable`: 適している
 * - `conditional`: 条件付きで適している
 * - `unsuitable`: 適していない
 * - `not-applicable`: 対象外（その災害種別の避難先として指定されていない）
 */
export const SHELTER_SUITABILITIES = [
  'suitable',
  'conditional',
  'unsuitable',
  'not-applicable',
] as const;
export type ShelterSuitability = (typeof SHELTER_SUITABILITIES)[number];

/** 値が既知の適否（{@link ShelterSuitability}）かどうかを判定する。 */
export function isShelterSuitability(value: unknown): value is ShelterSuitability {
  return SHELTER_SUITABILITIES.includes(value as ShelterSuitability);
}

/** 災害種別ごとの適否。情報が無い災害種別はキーを持たない。 */
export type ShelterSuitabilityByDisaster = Partial<Record<DisasterType, ShelterSuitability>>;

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
  /** 問い合わせ先の電話番号。未登録の場合は undefined。 */
  phoneNumber?: string;
  /** 災害種別ごとの適否。1 種別も情報が無い場合は undefined。 */
  suitability?: ShelterSuitabilityByDisaster;
  /** 開設状況の参考となる外部ページ（自治体の避難所情報ページ等）。無い場合は undefined。 */
  externalUrl?: string;
};
