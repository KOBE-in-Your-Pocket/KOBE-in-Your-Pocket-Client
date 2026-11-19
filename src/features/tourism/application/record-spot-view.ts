import type { SpotViewRepository } from '../domain/spot-view';

/**
 * 観光スポットの閲覧を 1 回数えるユースケース（#834）。
 *
 * domain の {@link SpotViewRepository} 経由で記録する。
 * 具体実装の選択は呼び出し側（composition root）の責務とする。
 */
export function recordSpotView(spotId: string, repository: SpotViewRepository): Promise<void> {
  return repository.recordSpotView(spotId);
}
