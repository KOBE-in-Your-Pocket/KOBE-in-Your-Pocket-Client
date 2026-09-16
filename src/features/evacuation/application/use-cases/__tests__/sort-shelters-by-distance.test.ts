import { sortSheltersByDistance } from '../sort-shelters-by-distance';

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

// 三ノ宮駅付近を原点に、東へ離れるほど遠くなる3地点。
const ORIGIN = { latitude: 34.694722, longitude: 135.195833 };
const SHELTERS: EvacuationShelter[] = [
  makeShelter('far', 34.694722, 135.35),
  makeShelter('near', 34.694722, 135.2),
  makeShelter('mid', 34.694722, 135.25),
];

describe('sortSheltersByDistance', () => {
  it('coords がある場合、各避難所に distanceKm を付与する', () => {
    const result = sortSheltersByDistance(SHELTERS, ORIGIN);

    result.forEach((shelter) => {
      expect(typeof shelter.distanceKm).toBe('number');
    });
  });

  it('coords がある場合、近い順にソートする', () => {
    const result = sortSheltersByDistance(SHELTERS, ORIGIN);

    expect(result.map((s) => s.id)).toEqual(['near', 'mid', 'far']);
  });

  it('coords が null の場合、distanceKm は全件 null になる', () => {
    const result = sortSheltersByDistance(SHELTERS, null);

    result.forEach((shelter) => {
      expect(shelter.distanceKm).toBeNull();
    });
  });

  it('coords が null の場合、元の順序を維持する', () => {
    const result = sortSheltersByDistance(SHELTERS, null);

    expect(result.map((s) => s.id)).toEqual(['far', 'near', 'mid']);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(sortSheltersByDistance([], ORIGIN)).toEqual([]);
    expect(sortSheltersByDistance([], null)).toEqual([]);
  });

  it('1件のみの場合はソートせずそのまま返す', () => {
    const single = [SHELTERS[0]];

    const result = sortSheltersByDistance(single, ORIGIN);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('far');
  });
});
