import en from '../locales/en.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';
import zh from '../locales/zh.json';

import { SUPPORTED_LANGUAGES } from '../language';

const LOCALES = { en, ja, ko, zh } as const;

describe('locale files', () => {
  it.each(SUPPORTED_LANGUAGES)('%s に map.modeToggle の翻訳がある', (language) => {
    const locale = LOCALES[language];

    expect(locale.map.modeToggle.tourism).toBeTruthy();
    expect(locale.map.modeToggle.evacuation).toBeTruthy();
  });

  it.each(SUPPORTED_LANGUAGES)('%s に避難所カードの電話番号ラベルの翻訳がある', (language) => {
    expect(LOCALES[language].evacuation.shelterCard.phoneLabel).toBeTruthy();
  });

  it.each(SUPPORTED_LANGUAGES)('%s に避難所の災害種別タグの翻訳がある', (language) => {
    const locale = LOCALES[language];

    expect(locale.evacuation.disasterFilter.landslide).toBeTruthy();
    expect(locale.evacuation.disasterFilter.flood).toBeTruthy();
    expect(locale.evacuation.disasterFilter.tsunami).toBeTruthy();
    expect(locale.evacuation.disasterFilter['large-fire']).toBeTruthy();
    expect(locale.evacuation.list.filterEmpty).toBeTruthy();
  });
});
