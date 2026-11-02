import { getItem, setItem } from '@/shared/lib/storage';

/** 避難所データを最後に取得した日時（エポックミリ秒）を AsyncStorage に保存する際のキー。 */
export const EVACUATION_SHELTERS_LAST_FETCHED_AT_STORAGE_KEY = 'evacuation.shelters.lastFetchedAt';

/**
 * 避難所データを最後に取得した日時（エポックミリ秒）を読み出す。
 * 未保存（日時を記録する前のバージョンで取得した端末を含む）・不正な値の場合は null を返す。
 */
export async function getShelterLastFetchedAt(): Promise<number | null> {
  const stored = await getItem<unknown>(EVACUATION_SHELTERS_LAST_FETCHED_AT_STORAGE_KEY);

  return typeof stored === 'number' && Number.isFinite(stored) ? stored : null;
}

/** 避難所データを最後に取得した日時（エポックミリ秒）を保存する。 */
export async function setShelterLastFetchedAt(fetchedAt: number): Promise<void> {
  await setItem(EVACUATION_SHELTERS_LAST_FETCHED_AT_STORAGE_KEY, fetchedAt);
}
