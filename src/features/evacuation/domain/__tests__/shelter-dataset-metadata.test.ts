import { isShelterDatasetMetadata } from '../shelter-dataset-metadata';

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
