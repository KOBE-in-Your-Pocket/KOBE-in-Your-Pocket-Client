import type * as Location from 'expo-location';

/** 三ノ宮駅（JR）付近の座標。シミュレータ / Web 開発時のデフォルト現在地。 */
export const SANNOMIYA_STATION_COORDS: Location.LocationObjectCoords = {
  latitude: 34.694722,
  longitude: 135.195833,
  altitude: null,
  accuracy: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

/**
 * 実機以外（シミュレータ・エミュレータ・Web）の開発環境では
 * GPS の代わりに三ノ宮駅を現在地として使う。
 */
export function shouldUseDevDefaultLocation(isDevice: boolean, platformOs: string): boolean {
  return __DEV__ && (!isDevice || platformOs === 'web');
}

export function createDevDefaultCoords(): Location.LocationObjectCoords {
  return { ...SANNOMIYA_STATION_COORDS };
}
