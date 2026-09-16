import { getDistanceKm, type GeoCoordinates } from '@/shared/lib/geo';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

export type ShelterWithDistance = EvacuationShelter & {
  distanceKm: number | null;
};

/**
 * 現在地からの距離を各避難所に付与し、近い順にソートする。
 * `coords` が無い場合は距離を計算せず、元の順序のまま返す。
 */
export function sortSheltersByDistance(
  shelters: EvacuationShelter[],
  coords: GeoCoordinates | null,
): ShelterWithDistance[] {
  const withDistance = shelters.map((shelter) => ({
    ...shelter,
    distanceKm: coords ? getDistanceKm(coords, shelter.coordinates) : null,
  }));

  if (!coords) return withDistance;

  return [...withDistance].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
