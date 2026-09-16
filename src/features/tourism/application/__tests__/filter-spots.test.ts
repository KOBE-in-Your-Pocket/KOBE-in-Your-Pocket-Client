import { filterSpotsByGenre } from '../use-filtered-spots';

import type { Spot } from '../../domain/spot';

const makeSpot = (id: string, genre: Spot['genre']): Spot => ({
  id,
  genre,
  name: id,
  description: '',
  address: '',
  businessHours: '',
  coordinates: { latitude: 0, longitude: 0 },
  category: { label: '' },
  media: { imageUrl: '' },
});

const SPOTS: Spot[] = [
  makeSpot('kobe-port-tower', 'landmark'),
  makeSpot('kitano-ijinkan', 'history'),
  makeSpot('nankinmachi', 'gourmet'),
  makeSpot('arima-onsen', 'onsen'),
  makeSpot('mount-rokko', 'nature'),
];

describe('filterSpotsByGenre', () => {
  it("'all' を指定すると全件を返す", () => {
    expect(filterSpotsByGenre(SPOTS, 'all')).toHaveLength(SPOTS.length);
  });

  it("'all' を指定すると同じ配列参照を返す", () => {
    expect(filterSpotsByGenre(SPOTS, 'all')).toBe(SPOTS);
  });

  it.each([
    ['landmark', 'kobe-port-tower'],
    ['history', 'kitano-ijinkan'],
    ['gourmet', 'nankinmachi'],
    ['onsen', 'arima-onsen'],
    ['nature', 'mount-rokko'],
  ] as const)("'%s' を指定すると該当スポット（%s）のみ返す", (genre, expectedId) => {
    const result = filterSpotsByGenre(SPOTS, genre);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(expectedId);
  });

  it('該当スポットがない場合は空配列を返す', () => {
    const spotsWithoutLandmark = SPOTS.filter((s) => s.genre !== 'landmark');

    expect(filterSpotsByGenre(spotsWithoutLandmark, 'landmark')).toHaveLength(0);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(filterSpotsByGenre([], 'history')).toHaveLength(0);
  });
});
