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

    expect(locale.evacuation.disasterType.landslide).toBeTruthy();
    expect(locale.evacuation.disasterType.flood).toBeTruthy();
    expect(locale.evacuation.disasterType.tsunami).toBeTruthy();
    expect(locale.evacuation.disasterType['large-fire']).toBeTruthy();
    expect(locale.evacuation.list.filterEmpty).toBeTruthy();
  });

  it.each(SUPPORTED_LANGUAGES)('%s に避難所の災害ごとの利用可否の翻訳がある', (language) => {
    const { suitability } = LOCALES[language].evacuation;

    expect(suitability.title).toBeTruthy();
    expect(suitability.suitable).toBeTruthy();
    expect(suitability.conditional).toBeTruthy();
    expect(suitability.unsuitable).toBeTruthy();
    expect(suitability['not-applicable']).toBeTruthy();
    expect(suitability.unknown).toBeTruthy();
    expect(suitability.label).toContain('{{disaster}}');
    expect(suitability.label).toContain('{{status}}');
  });

  it.each(SUPPORTED_LANGUAGES)('%s にアイコン調整画面の翻訳がある', (language) => {
    const locale = LOCALES[language];
    const { iconCrop } = locale.settings.accountEdit;

    expect(iconCrop.title).toBeTruthy();
    expect(iconCrop.confirm).toBeTruthy();
    expect(iconCrop.hint).toBeTruthy();
    expect(iconCrop.areaLabel).toBeTruthy();
    // キャンセルは設定画面共通の文言を使う。
    expect(locale.settings.cancel).toBeTruthy();
  });
});
