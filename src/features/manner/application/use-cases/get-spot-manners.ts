import type { MannerItem } from '../../domain/manner-item';

/**
 * 指定スポット ID に紐づくマナー項目を抽出するユースケース。
 *
 * `relatedSpotIds` に `spotId` を含む項目だけを返す。該当が無ければ空配列。
 */
export function getSpotManners(spotId: string, manners: MannerItem[]): MannerItem[] {
  return manners.filter((manner) => manner.relatedSpotIds.includes(spotId));
}
