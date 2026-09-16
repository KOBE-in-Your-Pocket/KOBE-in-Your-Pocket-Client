import { HOME_CARDS } from '../home-cards';

import en from '@/shared/lib/i18n/locales/en.json';
import ja from '@/shared/lib/i18n/locales/ja.json';
import ko from '@/shared/lib/i18n/locales/ko.json';
import zh from '@/shared/lib/i18n/locales/zh.json';

const LOCALES = { ja, en, ko, zh };

/** ドット区切りパスで翻訳辞書から値を取り出す。 */
function resolve(dict: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
}

describe('HOME_CARDS', () => {
  it('観光 / 地図 / マナー / 避難所 の 4 枚を持つ', () => {
    expect(HOME_CARDS).toHaveLength(4);
  });

  it('各カードは tabs ルートへの href・色・プラットフォーム別シンボルを持つ', () => {
    for (const card of HOME_CARDS) {
      expect(card.href).toMatch(/^\/\(tabs\)\//);
      expect(card.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(card.symbol.ios).toBeTruthy();
      expect(card.symbol.android).toBeTruthy();
      expect(card.symbol.web).toBeTruthy();
    }
  });

  it('labelKey と href は重複しない', () => {
    const keys = HOME_CARDS.map((c) => c.labelKey);
    const hrefs = HOME_CARDS.map((c) => c.href);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it.each(Object.entries(LOCALES))('%s: 全カードのラベルが翻訳されている', (_lang, dict) => {
    for (const card of HOME_CARDS) {
      expect(resolve(dict, card.labelKey)).toBeTruthy();
    }
  });
});
