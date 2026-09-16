import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ShelterDatasetMetadata } from '../../../domain/shelter-dataset-metadata';
import {
  EVACUATION_SHELTERS_METADATA_STORAGE_KEY,
  getShelterDatasetMetadata,
  setShelterDatasetMetadata,
} from '../shelter-dataset-metadata-storage';

const METADATA: ShelterDatasetMetadata = {
  source: '神戸市オープンデータ',
  asOf: '2025-04-02',
  updatedAt: '2025-04-02T00:00:00Z',
};

describe('shelter-dataset-metadata-storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('保存した出典・基準日を読み戻せる', async () => {
    await setShelterDatasetMetadata(METADATA);

    await expect(getShelterDatasetMetadata()).resolves.toEqual(METADATA);
  });

  it('未保存のときは null を返す', async () => {
    await expect(getShelterDatasetMetadata()).resolves.toBeNull();
  });

  it('保存済みの値が壊れている（項目欠落）ときは null を返す', async () => {
    await AsyncStorage.setItem(
      EVACUATION_SHELTERS_METADATA_STORAGE_KEY,
      JSON.stringify({ source: '神戸市オープンデータ' }),
    );

    await expect(getShelterDatasetMetadata()).resolves.toBeNull();
  });
});
