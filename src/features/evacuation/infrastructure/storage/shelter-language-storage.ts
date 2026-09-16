import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';
import { getItem, setItem } from '@/shared/lib/storage';

/** 避難所を最後にシードした表示言語を AsyncStorage に保存する際のキー。 */
export const EVACUATION_SHELTERS_LANGUAGE_STORAGE_KEY = 'evacuation.shelters.lastSeededLanguage';

/**
 * 避難所を最後にシードした表示言語を読み出す。
 * 未保存・サポート外の値の場合は null を返す。
 */
export async function getLastSeededShelterLanguage(): Promise<SupportedLanguage | null> {
  const stored = await getItem<string>(EVACUATION_SHELTERS_LANGUAGE_STORAGE_KEY);

  if (stored !== null && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }

  return null;
}

/** 避難所を最後にシードした表示言語を保存する。 */
export async function setLastSeededShelterLanguage(language: SupportedLanguage): Promise<void> {
  await setItem(EVACUATION_SHELTERS_LANGUAGE_STORAGE_KEY, language);
}
