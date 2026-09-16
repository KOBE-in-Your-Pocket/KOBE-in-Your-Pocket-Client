import { createInstance, type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { FALLBACK_LANGUAGE, resolveLanguage, SUPPORTED_LANGUAGES } from './language';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';

export {
  FALLBACK_LANGUAGE,
  LANGUAGE_AUTONYMS,
  resolveLanguage,
  SUPPORTED_LANGUAGES,
} from './language';
export type { SupportedLanguage } from './language';
export {
  LANGUAGE_STORAGE_KEY,
  loadPersistedLanguage,
  resolveInitialLanguage,
} from './persisted-language';

let i18nInstance: I18nInstance | null = null;

export function initI18n(): I18nInstance {
  if (i18nInstance?.isInitialized) {
    return i18nInstance;
  }

  const i18n = i18nInstance ?? createInstance();
  const language = resolveLanguage();

  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
      zh: { translation: zh },
      ko: { translation: ko },
    },
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

  i18nInstance = i18n;
  return i18n;
}

export default initI18n;
