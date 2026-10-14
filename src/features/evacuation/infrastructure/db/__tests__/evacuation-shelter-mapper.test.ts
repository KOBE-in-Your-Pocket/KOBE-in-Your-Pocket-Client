import type { EvacuationShelter } from '../../../domain/evacuation-shelter';

import { toEvacuationShelter, toEvacuationShelterRecord } from '../evacuation-shelter-mapper';
import type { EvacuationShelterRecord } from '../schema';

const sampleShelter: EvacuationShelter = {
  id: 'kobe-city-hall',
  name: '神戸市役所',
  address: '兵庫県神戸市中央区加納町6丁目5-1',
  coordinates: { latitude: 34.6909, longitude: 135.1956 },
  type: 'designated',
  facilityCategory: 'government',
  media: { imageUrl: 'https://example.com/hall.jpg' },
  capacity: 850,
  accessible: true,
  externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
  phoneNumber: '078-331-8181',
  suitability: {
    landslide: 'suitable',
    flood: 'conditional',
    tsunami: 'unsuitable',
    'large-fire': 'not-applicable',
  },
};

/** {@link sampleShelter} に対応する SQLite レコード。 */
const sampleRecord: EvacuationShelterRecord = {
  id: 'kobe-city-hall',
  name: '神戸市役所',
  address: '兵庫県神戸市中央区加納町6丁目5-1',
  latitude: 34.6909,
  longitude: 135.1956,
  type: 'designated',
  facilityCategory: 'government',
  imageUrl: 'https://example.com/hall.jpg',
  capacity: 850,
  accessible: true,
  externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
  phoneNumber: '078-331-8181',
  suitabilityLandslide: 'suitable',
  suitabilityFlood: 'conditional',
  suitabilityTsunami: 'unsuitable',
  suitabilityLargeFire: 'not-applicable',
};

describe('evacuation-shelter-mapper', () => {
  it('ドメインモデルを SQLite レコードに変換する', () => {
    expect(toEvacuationShelterRecord(sampleShelter)).toEqual(sampleRecord);
  });

  it('SQLite レコードをドメインモデルに変換する', () => {
    expect(toEvacuationShelter(sampleRecord)).toEqual(sampleShelter);
  });

  it('domain → record → domain の往復で値が保持される', () => {
    // insert 用の型（NULL 可の列が省略可能）を select 結果の型へ合わせるため、sampleRecord に重ねる。
    const record = { ...sampleRecord, ...toEvacuationShelterRecord(sampleShelter) };

    expect(toEvacuationShelter(record)).toEqual(sampleShelter);
  });

  it('capacity 未設定は undefined として復元する', () => {
    expect(toEvacuationShelter({ ...sampleRecord, capacity: null }).capacity).toBeUndefined();
  });

  it('externalUrl 未設定は undefined として復元する', () => {
    expect(toEvacuationShelter({ ...sampleRecord, externalUrl: null }).externalUrl).toBeUndefined();
  });

  it('phoneNumber 未設定は null として保存し、undefined として復元する', () => {
    const { phoneNumber: _phoneNumber, ...shelterWithoutPhoneNumber } = sampleShelter;

    expect(toEvacuationShelterRecord(shelterWithoutPhoneNumber).phoneNumber).toBeNull();
    expect(toEvacuationShelter({ ...sampleRecord, phoneNumber: null }).phoneNumber).toBeUndefined();
  });

  describe('suitability（災害種別ごとの適否）', () => {
    it('未設定は全列 null として保存し、undefined として復元する', () => {
      const { suitability: _suitability, ...shelterWithoutSuitability } = sampleShelter;

      const record = toEvacuationShelterRecord(shelterWithoutSuitability);

      expect(record).toMatchObject({
        suitabilityLandslide: null,
        suitabilityFlood: null,
        suitabilityTsunami: null,
        suitabilityLargeFire: null,
      });
      expect(
        toEvacuationShelter({
          ...sampleRecord,
          suitabilityLandslide: null,
          suitabilityFlood: null,
          suitabilityTsunami: null,
          suitabilityLargeFire: null,
        }).suitability,
      ).toBeUndefined();
    });

    it('一部の災害種別だけ情報がある場合は、その種別だけを往復させる', () => {
      const shelter: EvacuationShelter = { ...sampleShelter, suitability: { flood: 'suitable' } };

      const record = toEvacuationShelterRecord(shelter);

      expect(record).toMatchObject({
        suitabilityLandslide: null,
        suitabilityFlood: 'suitable',
        suitabilityTsunami: null,
        suitabilityLargeFire: null,
      });
      expect(toEvacuationShelter({ ...sampleRecord, ...record }).suitability).toEqual({
        flood: 'suitable',
      });
    });
  });
});
