import { filterSpotsByGenre, filterSpotsByKeyword } from '../use-filtered-spots';

import type { Spot } from '../../domain/spot';

const makeSpot = (id: string, genre: Spot['genre'], name: string = id): Spot => ({
  id,
  genre,
  name,
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

describe('filterSpotsByKeyword', () => {
  const KEYWORD_SPOTS: Spot[] = [
    makeSpot('kobe-port-tower', 'landmark', '神戸ポートタワー'),
    makeSpot('kitano-ijinkan', 'history', '北野異人館'),
    makeSpot('nankinmachi', 'gourmet', '南京町'),
  ];

  it('名前の一部が一致するスポットだけを返す', () => {
    const result = filterSpotsByKeyword(KEYWORD_SPOTS, 'ポート');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('kobe-port-tower');
  });

  it('大文字・小文字が違っても一致する', () => {
    const spots = [makeSpot('rokko', 'nature', 'Mount Rokko')];

    expect(filterSpotsByKeyword(spots, 'rokko')).toHaveLength(1);
    expect(filterSpotsByKeyword(spots, 'ROKKO')).toHaveLength(1);
  });

  it('全角・半角が違っても一致する', () => {
    const spots = [makeSpot('rokko', 'nature', 'Mount Rokko')];

    expect(filterSpotsByKeyword(spots, 'ＲＯＫＫＯ')).toHaveLength(1);
  });

  it('前後の空白は無視する', () => {
    const result = filterSpotsByKeyword(KEYWORD_SPOTS, '  南京町  ');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('nankinmachi');
  });

  it('キーワードが空のときは全件を返す', () => {
    expect(filterSpotsByKeyword(KEYWORD_SPOTS, '')).toHaveLength(KEYWORD_SPOTS.length);
  });

  it('キーワードが空白だけのときは全件を返す', () => {
    expect(filterSpotsByKeyword(KEYWORD_SPOTS, '   ')).toHaveLength(KEYWORD_SPOTS.length);
  });

  it('一致するスポットがない場合は空配列を返す', () => {
    expect(filterSpotsByKeyword(KEYWORD_SPOTS, '存在しない')).toHaveLength(0);
  });
});
