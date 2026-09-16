import { Linking, Platform } from 'react-native';

/** 経路の出発地・目的地に使う緯度経度。 */
export type DirectionsCoordinate = {
  latitude: number;
  longitude: number;
};

/** 移動手段。観光用途のためデフォルトは徒歩。 */
export type DirectionsTravelMode = 'walking' | 'driving' | 'transit';

export type OpenDirectionsOptions = {
  /** 出発地。未指定なら外部マップアプリ側の現在地が使われる。 */
  origin?: DirectionsCoordinate | null;
  /** 移動手段（デフォルト: walking）。 */
  mode?: DirectionsTravelMode;
  /** URL 生成に使うプラットフォーム（テスト用に注入可能。既定は Platform.OS）。 */
  platformOs?: typeof Platform.OS;
};

/** Apple マップの dirflg（移動手段）パラメータ。 */
const APPLE_DIRFLG: Record<DirectionsTravelMode, string> = {
  walking: 'w',
  driving: 'd',
  transit: 'r',
};

const formatCoord = ({ latitude, longitude }: DirectionsCoordinate): string =>
  `${latitude},${longitude}`;

/**
 * 現在地 → 目的地の経路を表示する外部マップ URL を生成する。
 * iOS は Apple マップ、それ以外は Google マップの汎用 URL を返す。
 */
export function buildDirectionsUrl(
  destination: DirectionsCoordinate,
  options: OpenDirectionsOptions = {},
): string {
  const mode = options.mode ?? 'walking';
  const origin = options.origin;
  const platformOs = options.platformOs ?? Platform.OS;
  const dest = formatCoord(destination);

  if (platformOs === 'ios') {
    const params = [`daddr=${dest}`, `dirflg=${APPLE_DIRFLG[mode]}`];
    if (origin) params.unshift(`saddr=${formatCoord(origin)}`);
    return `http://maps.apple.com/?${params.join('&')}`;
  }

  // Android / Web は Google マップの汎用ディレクション URL（アプリが入っていれば起動、なければブラウザ）。
  const params = [`api=1`, `destination=${dest}`, `travelmode=${mode}`];
  if (origin) params.push(`origin=${formatCoord(origin)}`);
  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

/**
 * 現在地 → 目的地のターンバイターン経路案内を外部マップアプリ（Apple/Google マップ）で開く。
 */
export async function openDirections(
  destination: DirectionsCoordinate,
  options: OpenDirectionsOptions = {},
): Promise<void> {
  const url = buildDirectionsUrl(destination, options);
  await Linking.openURL(url);
}
