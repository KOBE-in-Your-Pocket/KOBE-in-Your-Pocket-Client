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
});
