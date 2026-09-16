import { getItem } from '@/shared/lib/storage';

import { resolveLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from './language';

/** 表示言語を AsyncStorage に保存する際のキー。 */
export const LANGUAGE_STORAGE_KEY = 'settings.language';

/**
 * 保存済みの表示言語を読み出す。
 * 未保存・サポート外の値の場合は null を返す。
 */
export async function loadPersistedLanguage(): Promise<SupportedLanguage | null> {
  const stored = await getItem<string>(LANGUAGE_STORAGE_KEY);

  if (stored !== null && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }

  return null;
}

/**
 * 起動時に適用する表示言語を解決する。
 * 保存済みの言語があればそれを採用し、無ければデバイス言語（最終的には en）へフォールバックする。
 */
export async function resolveInitialLanguage(): Promise<SupportedLanguage> {
  return (await loadPersistedLanguage()) ?? resolveLanguage();
}
