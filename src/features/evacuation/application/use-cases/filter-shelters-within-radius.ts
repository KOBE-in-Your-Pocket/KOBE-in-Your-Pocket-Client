import { getDistanceKm, type GeoCoordinates } from '@/shared/lib/geo';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

/** 避難所マップで表示する既定の半径（km）。現在地からこの範囲内だけをピン表示する（#594）。 */
export const SHELTER_MAP_RADIUS_KM = 1;

/**
 * 現在地から指定半径（km）以内の避難所だけに絞り込む。
 * 境界（ちょうど radiusKm）は含める。
 * `coords` が無い場合は絞り込めないため全件を返す（現在地未取得時の扱いは #604）。
 */
export function filterSheltersWithinRadius(
  shelters: EvacuationShelter[],
  coords: GeoCoordinates | null,
  radiusKm: number = SHELTER_MAP_RADIUS_KM,
): EvacuationShelter[] {
  if (!coords) return shelters;

  return shelters.filter((shelter) => getDistanceKm(coords, shelter.coordinates) <= radiusKm);
}
