import * as Localization from 'expo-localization';
import type { Locale } from 'expo-localization';

import { FALLBACK_LANGUAGE, resolveLanguage } from '../language';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

const getLocales = jest.mocked(Localization.getLocales);

function mockLocales(languageCode: string): [Locale, ...Locale[]] {
  return [
    {
      languageTag: languageCode,
      languageCode,
      languageScriptCode: null,
      regionCode: null,
      languageRegionCode: null,
      currencyCode: null,
      currencySymbol: null,
      languageCurrencyCode: null,
      languageCurrencySymbol: null,
      decimalSeparator: '.',
      digitGroupingSeparator: ',',
      textDirection: 'ltr',
      measurementSystem: 'metric',
      temperatureUnit: 'celsius',
    },
  ];
}

describe('resolveLanguage', () => {
  beforeEach(() => {
    getLocales.mockReset();
  });

  describe('サポート言語', () => {
    it.each(['ja', 'en', 'zh', 'ko'] as const)('%s をそのまま採用する', (language) => {
      expect(resolveLanguage(language)).toBe(language);
    });
  });

  describe('非サポート言語', () => {
    it.each(['fr', 'de', 'es', 'pt', 'it'] as const)(
      '%s は en にフォールバックする',
      (language) => {
        expect(resolveLanguage(language)).toBe(FALLBACK_LANGUAGE);
      },
    );
  });

  describe('デバイス言語（expo-localization）', () => {
    it('サポート言語の場合はそのまま採用する', () => {
      getLocales.mockReturnValue(mockLocales('ja'));

      expect(resolveLanguage()).toBe('ja');
    });

    it('非サポート言語の場合は en にフォールバックする', () => {
      getLocales.mockReturnValue(mockLocales('fr'));

      expect(resolveLanguage()).toBe(FALLBACK_LANGUAGE);
    });

    it('言語情報が取得できない場合は en にフォールバックする', () => {
      getLocales.mockReturnValue([] as unknown as ReturnType<typeof Localization.getLocales>);

      expect(resolveLanguage()).toBe(FALLBACK_LANGUAGE);
    });
  });
});

describe('initI18n', () => {
  beforeEach(() => {
    getLocales.mockReset();
  });

  it('サポート言語で初期化する', () => {
    getLocales.mockReturnValue(mockLocales('ja'));

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { initI18n } = require('../index') as typeof import('../index');
      const i18n = initI18n();

      expect(i18n.language).toBe('ja');
    });
  });

  it('非サポート言語は en で初期化する', () => {
    getLocales.mockReturnValue(mockLocales('fr'));

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { initI18n } = require('../index') as typeof import('../index');
      const i18n = initI18n();

      expect(i18n.language).toBe(FALLBACK_LANGUAGE);
    });
  });
});
