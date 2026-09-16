/** タブバー本体の高さ（セーフエリア除く）。アイコン + ラベル + 余白。 */
export const TAB_BAR_CONTENT_HEIGHT = 68;

export const TAB_BAR_COLORS = {
  active: '#208AEF',
  inactive: '#6B635B',
  activeBorder: '#C4E0FA',
  background: '#FFFFFF',
} as const;

export type TabDefinition = {
  name: string;
  labelKey: string;
  href: `/(tabs)/${string}`;
  symbol: {
    ios: string;
    android: string;
    web: string;
  };
};

export const TAB_DEFS = [
  {
    name: 'home',
    labelKey: 'tabs.home',
    href: '/(tabs)/home',
    symbol: { ios: 'house', android: 'home', web: 'home' },
  },
  {
    name: 'map',
    labelKey: 'tabs.map',
    href: '/(tabs)/map',
    symbol: { ios: 'location.north.line', android: 'navigation', web: 'navigation' },
  },
  {
    name: 'tourism',
    labelKey: 'tabs.tourism',
    href: '/(tabs)/tourism',
    symbol: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  },
  {
    name: 'manners',
    labelKey: 'tabs.manner',
    href: '/(tabs)/manners',
    symbol: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  },
  {
    name: 'settings',
    labelKey: 'tabs.settings',
    href: '/(tabs)/settings',
    symbol: { ios: 'gearshape', android: 'settings', web: 'settings' },
  },
] as const satisfies readonly TabDefinition[];

/** タブバーにボタンを出さず、プログラム遷移だけ許可するルート。 */
export const HIDDEN_TAB_DEFS = [
  {
    name: 'evacuation',
    href: '/(tabs)/evacuation',
  },
] as const satisfies readonly { name: string; href: `/(tabs)/${string}` }[];
