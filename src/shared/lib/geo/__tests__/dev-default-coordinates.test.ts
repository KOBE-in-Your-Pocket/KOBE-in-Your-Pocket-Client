import {
  createDevDefaultCoords,
  SANNOMIYA_STATION_COORDS,
  shouldUseDevDefaultLocation,
} from '../dev-default-coordinates';

describe('shouldUseDevDefaultLocation', () => {
  it('シミュレータ（isDevice=false）では true', () => {
    expect(shouldUseDevDefaultLocation(false, 'ios')).toBe(true);
    expect(shouldUseDevDefaultLocation(false, 'android')).toBe(true);
  });

  it('Web では true', () => {
    expect(shouldUseDevDefaultLocation(true, 'web')).toBe(true);
  });

  it('実機（iOS/Android）では false', () => {
    expect(shouldUseDevDefaultLocation(true, 'ios')).toBe(false);
    expect(shouldUseDevDefaultLocation(true, 'android')).toBe(false);
  });
});

describe('createDevDefaultCoords', () => {
  it('三ノ宮駅の座標を返す', () => {
    expect(createDevDefaultCoords()).toEqual(SANNOMIYA_STATION_COORDS);
  });

  it('返却オブジェクトは毎回新しいインスタンス', () => {
    const first = createDevDefaultCoords();
    const second = createDevDefaultCoords();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});
