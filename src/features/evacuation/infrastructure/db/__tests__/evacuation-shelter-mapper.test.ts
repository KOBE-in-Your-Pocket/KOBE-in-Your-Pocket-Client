import type { EvacuationShelter } from '../../../domain/evacuation-shelter';

import { toEvacuationShelter, toEvacuationShelterRecord } from '../evacuation-shelter-mapper';

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
};

describe('evacuation-shelter-mapper', () => {
  it('ドメインモデルを SQLite レコードに変換する', () => {
    expect(toEvacuationShelterRecord(sampleShelter)).toEqual({
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
    });
  });

  it('SQLite レコードをドメインモデルに変換する', () => {
    expect(
      toEvacuationShelter({
        id: 'kobe-city-hall',
        name: '神戸市役所',
        address: '兵庫県神戸市中央区加納町6丁目5-1',
        latitude: 34.6909,
        longitude: 135.1956,
        type: 'designated',
        facilityCategory: 'government',
        imageUrl: 'https://example.com/hall.jpg',
        capacity: null,
        accessible: true,
        externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
      }),
    ).toEqual({
      ...sampleShelter,
      capacity: undefined,
    });
  });

  it('capacity 未設定は undefined として復元する', () => {
    expect(
      toEvacuationShelter({
        id: 'kobe-city-hall',
        name: '神戸市役所',
        address: '兵庫県神戸市中央区加納町6丁目5-1',
        latitude: 34.6909,
        longitude: 135.1956,
        type: 'designated',
        facilityCategory: 'government',
        imageUrl: 'https://example.com/hall.jpg',
        capacity: null,
        accessible: true,
        externalUrl: null,
      }).capacity,
    ).toBeUndefined();
  });

  it('externalUrl 未設定は undefined として復元する', () => {
    expect(
      toEvacuationShelter({
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
        externalUrl: null,
      }).externalUrl,
    ).toBeUndefined();
  });
});
