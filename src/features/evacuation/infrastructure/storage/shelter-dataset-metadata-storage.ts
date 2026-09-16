import { getItem, setItem } from '@/shared/lib/storage';

import type { ShelterDatasetMetadata } from '../../domain/shelter-dataset-metadata';
import { isShelterDatasetMetadata } from '../../domain/shelter-dataset-metadata';

/** 避難所データセットの出典・基準日を AsyncStorage に保存する際のキー。 */
export const EVACUATION_SHELTERS_METADATA_STORAGE_KEY = 'evacuation.shelters.datasetMetadata';

/**
 * 保存済みのデータセットメタデータを読み出す。未保存・壊れた値の場合は null。
 *
 * 避難所一覧は SQLite に保存してオフラインでも表示できるため、その出典・基準日も
 * 同じくオフラインで参照できる必要がある。一覧本体と違い 1 レコードなので
 * SQLite ではなく AsyncStorage に置く。
 */
export async function getShelterDatasetMetadata(): Promise<ShelterDatasetMetadata | null> {
  const stored = await getItem<unknown>(EVACUATION_SHELTERS_METADATA_STORAGE_KEY);

  return isShelterDatasetMetadata(stored) ? stored : null;
}

/** データセットのメタデータを保存する。 */
export async function setShelterDatasetMetadata(metadata: ShelterDatasetMetadata): Promise<void> {
  await setItem(EVACUATION_SHELTERS_METADATA_STORAGE_KEY, metadata);
}
