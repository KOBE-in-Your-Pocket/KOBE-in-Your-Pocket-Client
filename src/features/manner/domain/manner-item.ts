/** マナー項目の分類（守るべきマナー / 法令・条例上のルール）。一覧のフィルタキー兼用。 */
export type MannerKind = 'manner' | 'rule';

/** マナー項目の適用地域（各所 / 日本全般）。一覧のフィルタキー兼用。 */
export type MannerScope = 'local' | 'japan';

/**
 * マナー項目のドメインモデル。
 * 一覧表示・フィルタ・観光名所連携で共通利用する最小フィールドを揃える。
 */
export type MannerItem = {
  id: string;
  title: string;
  /** 一覧カード等で表示する短い説明。 */
  description: string;
  /** アイコン識別キー（アイコンコンポーネントへのマッピング用）。 */
  icon: string;
  /**
   * ピクトグラム画像の参照キー（画像アセットへのマッピング用）。
   * 対応する画像が無い場合は null（UI 側で `icon` によるフォールバック表示を想定）。
   */
  imageKey: string | null;
  kind: MannerKind;
  scope: MannerScope;
  /**
   * 関連する観光スポットの ID 一覧（tourism ドメインの `Spot.id` を参照）。
   * 関連が無い場合は空配列。
   */
  relatedSpotIds: string[];
};
