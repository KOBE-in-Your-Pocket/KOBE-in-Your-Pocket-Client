import * as Localization from 'expo-localization';

export const SUPPORTED_LANGUAGES = ['ja', 'en', 'zh', 'ko'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

/** 各言語をその言語自身の表記（自称）で表したラベル */
export const LANGUAGE_AUTONYMS: Record<SupportedLanguage, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
  ko: '한국어',
};

export function resolveLanguage(deviceLanguage?: string | null): SupportedLanguage {
  const code = deviceLanguage ?? Localization.getLocales()[0]?.languageCode ?? FALLBACK_LANGUAGE;

  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)
    ? (code as SupportedLanguage)
    : FALLBACK_LANGUAGE;
}
