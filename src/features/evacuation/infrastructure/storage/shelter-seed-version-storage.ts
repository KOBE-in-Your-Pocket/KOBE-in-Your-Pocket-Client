import { getItem, setItem } from '@/shared/lib/storage';

/** 避難所を最後にシードしたときのシード版を AsyncStorage に保存する際のキー。 */
export const EVACUATION_SHELTERS_SEED_VERSION_STORAGE_KEY = 'evacuation.shelters.lastSeededVersion';

/**
 * 避難所を最後にシードしたときのシード版を読み出す。
 * 未保存（シード版を記録する前のバージョンでシードした端末を含む）・不正な値の場合は null を返す。
 */
export async function getLastSeededShelterVersion(): Promise<number | null> {
  const stored = await getItem<unknown>(EVACUATION_SHELTERS_SEED_VERSION_STORAGE_KEY);

  return typeof stored === 'number' && Number.isInteger(stored) ? stored : null;
}

/** 避難所を最後にシードしたときのシード版を保存する。 */
export async function setLastSeededShelterVersion(version: number): Promise<void> {
  await setItem(EVACUATION_SHELTERS_SEED_VERSION_STORAGE_KEY, version);
}
