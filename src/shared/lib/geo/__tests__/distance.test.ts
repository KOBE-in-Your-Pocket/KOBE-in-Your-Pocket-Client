import { formatDistanceKm, getDistanceKm } from '../distance';

describe('getDistanceKm', () => {
  it('同一点間の距離は 0 になる', () => {
    const coords = { latitude: 34.69, longitude: 135.19 };

    expect(getDistanceKm(coords, coords)).toBe(0);
  });

  it('神戸ポートタワーと北野異人館街の距離をおおよそ計算できる', () => {
    const portTower = { latitude: 34.6826, longitude: 135.1863 };
    const kitano = { latitude: 34.6989, longitude: 135.1896 };

    const distance = getDistanceKm(portTower, kitano);

    expect(distance).toBeGreaterThan(1);
    expect(distance).toBeLessThan(3);
  });
});

describe('formatDistanceKm', () => {
  it('1 km 未満はメートル表示にする', () => {
    expect(formatDistanceKm(0.8)).toBe('800 m');
  });

  it('1 km 以上は小数第1位付きの km 表示にする', () => {
    expect(formatDistanceKm(1.23)).toBe('1.2 km');
  });
});
