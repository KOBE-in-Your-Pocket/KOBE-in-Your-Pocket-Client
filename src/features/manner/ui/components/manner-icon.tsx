import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { useTheme } from '@/shared/lib/theme';

import type { MannerItem } from '../../domain/manner-item';

type SymbolName = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
};

/** MannerItem.icon（識別キー）→ 実際のピクトグラム名のマッピング。 */
const ICON_MAP: Record<string, SymbolName> = {
  'no-eating-while-walking': { ios: 'fork.knife.circle', android: 'no_food', web: 'no_food' },
  'put-trash-in-bin': { ios: 'trash.circle', android: 'delete', web: 'delete' },
  'no-trespassing': { ios: 'nosign', android: 'block', web: 'block' },
  'handle-products-with-care': { ios: 'hand.raised', android: 'pan_tool', web: 'pan_tool' },
  'do-not-obstruct-pedestrians': {
    ios: 'figure.walk',
    android: 'directions_walk',
    web: 'directions_walk',
  },
  'no-smoking-while-walking': {
    ios: 'smoke',
    android: 'smoke_free',
    web: 'smoke_free',
  },
  'hold-your-suitcase': { ios: 'bag', android: 'work', web: 'work' },
  'backpack-on-front': { ios: 'backpack', android: 'backpack', web: 'backpack' },
  'show-consideration': { ios: 'heart', android: 'favorite', web: 'favorite' },
  'no-loud-conversation': {
    ios: 'speaker.slash',
    android: 'volume_off',
    web: 'volume_off',
  },
  'no-phone-calls': { ios: 'phone.down', android: 'phone_disabled', web: 'phone_disabled' },
  'no-white-clothes-in-kinsen': { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  'no-feeding-wild-boars': { ios: 'pawprint', android: 'pets', web: 'pets' },

  // backend（`GET /api/v1/manner/items`）が返すアイコン識別キー（#412）。
  // mock が題材ごとのキー（no-eating-while-walking 等）だったのに対し、
  // backend は主題を表すキー（food / trash 等）を返すため別途対応づける。
  'hot-spring': { ios: 'drop', android: 'hot_tub', web: 'hot_tub' },
  mountain: { ios: 'mountain.2', android: 'landscape', web: 'landscape' },
  food: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  train: { ios: 'tram.fill', android: 'train', web: 'train' },
  users: { ios: 'person.2', android: 'group', web: 'group' },
  torii: { ios: 'building.columns', android: 'temple_buddhist', web: 'temple_buddhist' },
  'coin-off': { ios: 'yensign.circle', android: 'money_off', web: 'money_off' },
};

const DEFAULT_ICON: SymbolName = { ios: 'info.circle', android: 'info', web: 'info' };

/** MannerItem 用のピクトグラムアイコン。未知の icon キーはデフォルトの info アイコンにフォールバックする。 */
export function MannerIcon({ icon, size = 22 }: { icon: MannerItem['icon']; size?: number }) {
  const theme = useTheme();
  const name = ICON_MAP[icon] ?? DEFAULT_ICON;

  return <SymbolView tintColor={theme.text} name={name} size={size} />;
}
