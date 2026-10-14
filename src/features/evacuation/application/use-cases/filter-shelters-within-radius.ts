import { getDistanceKm, type GeoCoordinates } from '@/shared/lib/geo';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

/** 避難所マップで表示する既定の半径（km）。現在地からこの範囲内だけをピン表示する（#594）。 */
export const SHELTER_MAP_RADIUS_KM = 1;

/**
 * 現在地から指定半径（km）以内の避難所だけに絞り込む。
 * 境界（ちょうど radiusKm）は含める。
 *
 * 現在地が取得できない（`coords` が null）ときは絞り込めないため全件を返す。
 * 災害時に通信・測位が不安定でも避難所を見られるようにするためのフォールバック（#604）。
 * 現在地が得られれば半径内の絞り込みへ自動的に切り替わる。
 */
export function filterSheltersWithinRadius(
  shelters: EvacuationShelter[],
  coords: GeoCoordinates | null,
  radiusKm: number = SHELTER_MAP_RADIUS_KM,
): EvacuationShelter[] {
  if (!coords) return shelters;

  return shelters.filter((shelter) => getDistanceKm(coords, shelter.coordinates) <= radiusKm);
}
