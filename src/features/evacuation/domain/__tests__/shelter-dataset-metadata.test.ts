import {
  isShelterDatasetMetadata,
  parseShelterDatasetUpdatedAt,
} from '../shelter-dataset-metadata';

describe('parseShelterDatasetUpdatedAt', () => {
  const BASE_MS = Date.UTC(2026, 8, 29, 15, 13, 20);

  it.each([
    ['マイクロ秒まで（backend の形式）', '2026-09-29T15:13:20.984244Z', BASE_MS * 1000 + 984244],
    ['ミリ秒まで', '2026-09-29T15:13:20.984Z', BASE_MS * 1000 + 984000],
    ['小数部なし', '2026-09-29T15:13:20Z', BASE_MS * 1000],
    [
      'ナノ秒まで（マイクロ秒より細かい桁は切り捨て）',
      '2026-09-29T15:13:20.984244999Z',
      BASE_MS * 1000 + 984244,
    ],
    ['タイムゾーン付き', '2026-09-30T00:13:20.984244+09:00', BASE_MS * 1000 + 984244],
  ])('%s をエポックマイクロ秒に変換する', (_label, value, expected) => {
    expect(parseShelterDatasetUpdatedAt(value)).toBe(expected);
  });

  it.each([
    ['空文字', ''],
    ['日時でない', 'not-a-date'],
    ['日付のみ', '2026-09-29'],
    ['タイムゾーンなし', '2026-09-29T15:13:20.984244'],
    ['存在しない日付', '2026-13-45T15:13:20Z'],
  ])('%s は null', (_label, value) => {
    expect(parseShelterDatasetUpdatedAt(value)).toBeNull();
  });
});

const VALID = {
  source: '神戸市オープンデータ',
  asOf: '2025-04-02',
  updatedAt: '2025-04-02T00:00:00Z',
};

describe('isShelterDatasetMetadata', () => {
  it('出典・基準日・更新日時が揃っていれば true', () => {
    expect(isShelterDatasetMetadata(VALID)).toBe(true);
  });

  it('余分なフィールドがあっても true（バックエンドの拡張を壊さない）', () => {
    expect(isShelterDatasetMetadata({ ...VALID, license: 'CC BY 4.0' })).toBe(true);
  });

  it.each([
    ['出典が欠けている', { asOf: VALID.asOf, updatedAt: VALID.updatedAt }],
    ['基準日が欠けている', { source: VALID.source, updatedAt: VALID.updatedAt }],
    ['更新日時が欠けている', { source: VALID.source, asOf: VALID.asOf }],
    ['出典が空文字', { ...VALID, source: '' }],
    ['基準日が空文字', { ...VALID, asOf: '' }],
    ['型が違う', { ...VALID, asOf: 20250402 }],
  ])('%s ときは false', (_label, value) => {
    expect(isShelterDatasetMetadata(value)).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['文字列', 'metadata'],
    ['配列', []],
  ])('オブジェクトでない値（%s）は false', (_label, value) => {
    expect(isShelterDatasetMetadata(value)).toBe(false);
  });
});
