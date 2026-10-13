import { getDistanceKm } from '@/shared/lib/geo';

import {
  filterSheltersWithinRadius,
  SHELTER_MAP_RADIUS_KM,
} from '../filter-shelters-within-radius';

import type { EvacuationShelter } from '../../../domain/evacuation-shelter';

const makeShelter = (id: string, latitude: number, longitude: number): EvacuationShelter => ({
  id,
  name: id,
  address: '',
  coordinates: { latitude, longitude },
  type: 'designated',
  facilityCategory: 'school',
  media: { imageUrl: '' },
  accessible: false,
});

// 緯度 1 度 ≈ 111km。経度を固定し緯度差だけで距離を作る。
const ORIGIN = { latitude: 34.7, longitude: 135.2 };
const WITHIN = makeShelter('within', 34.7 + 0.005, 135.2); // 約 0.56km
const JUST_INSIDE = makeShelter('just-inside', 34.7 + 0.0088, 135.2); // 約 0.98km
const JUST_OUTSIDE = makeShelter('just-outside', 34.7 + 0.01, 135.2); // 約 1.11km
const FAR = makeShelter('far', 34.7 + 0.05, 135.2); // 約 5.6km

const SHELTERS = [WITHIN, JUST_INSIDE, JUST_OUTSIDE, FAR];

describe('filterSheltersWithinRadius', () => {
  it('既定半径は 1km', () => {
    expect(SHELTER_MAP_RADIUS_KM).toBe(1);
  });

  it('現在地から 1km 以内の避難所だけを返す', () => {
    const result = filterSheltersWithinRadius(SHELTERS, ORIGIN);

    expect(result.map((s) => s.id)).toEqual(['within', 'just-inside']);
  });

  it('1km を超える避難所は含めない', () => {
    const result = filterSheltersWithinRadius(SHELTERS, ORIGIN);

    expect(result.map((s) => s.id)).not.toContain('just-outside');
    expect(result.map((s) => s.id)).not.toContain('far');
  });

  it('境界（ちょうど半径）は含める', () => {
    const exactKm = getDistanceKm(ORIGIN, JUST_OUTSIDE.coordinates);

    // ちょうど境界ならば含める。
    expect(filterSheltersWithinRadius([JUST_OUTSIDE], ORIGIN, exactKm).map((s) => s.id)).toEqual([
      'just-outside',
    ]);
    // 境界より少しでも外なら含めない。
    expect(filterSheltersWithinRadius([JUST_OUTSIDE], ORIGIN, exactKm - 0.0001)).toEqual([]);
  });

  it('現在地が null のときは絞り込まず全件を返す', () => {
    const result = filterSheltersWithinRadius(SHELTERS, null);

    expect(result.map((s) => s.id)).toEqual(['within', 'just-inside', 'just-outside', 'far']);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(filterSheltersWithinRadius([], ORIGIN)).toEqual([]);
    expect(filterSheltersWithinRadius([], null)).toEqual([]);
  });
});
