import type { Href } from 'expo-router';

type HomeCardDef = {
  labelKey: string;
  /** ラベル下に添える簡単な説明文の i18n キー。 */
  descriptionKey: string;
  href: Href;
  /** カード背景色（home 専用ローカルパレット・白文字前提）。theme には依存しない。 */
  color: string;
  /** SymbolView 用のプラットフォーム別シンボル名（tab-bar と同形式）。 */
  symbol: { ios: string; android: string; web: string };
};

/**
 * ホームの Quick Access カード定義（観光 / 地図 / マナー / 避難所）。
 * 各カードは実ルートへ遷移する。色は機能ごとの識別色（琥珀 / 青 / 緑 / 赤）で、白文字前提。
 * `as const satisfies` でシンボル名のリテラル型を保持し SymbolView に渡せるようにする。
 */
export const HOME_CARDS = [
  {
    labelKey: 'home.shortcuts.tourism.label',
    descriptionKey: 'home.shortcuts.tourism.description',
    href: '/(tabs)/tourism',
    color: '#F59E0B',
    symbol: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  },
  {
    labelKey: 'home.shortcuts.map.label',
    descriptionKey: 'home.shortcuts.map.description',
    href: '/(tabs)/map',
    color: '#3B82F6',
    symbol: { ios: 'map', android: 'map', web: 'map' },
  },
  {
    labelKey: 'home.shortcuts.manners.label',
    descriptionKey: 'home.shortcuts.manners.description',
    href: '/(tabs)/manners',
    color: '#22C55E',
    symbol: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  },
  {
    labelKey: 'home.shortcuts.evacuation.label',
    descriptionKey: 'home.shortcuts.evacuation.description',
    href: '/(tabs)/evacuation',
    color: '#EF4444',
    symbol: { ios: 'shield.fill', android: 'shield', web: 'shield' },
  },
] as const satisfies readonly HomeCardDef[];

export type HomeCard = (typeof HOME_CARDS)[number];
