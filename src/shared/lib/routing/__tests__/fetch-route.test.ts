import { parseOrsGeoJson, type OrsGeoJson } from '../fetch-route';

describe('parseOrsGeoJson', () => {
  it('[経度, 緯度] を緯度経度に並べ替えて座標列を返す', () => {
    const json: OrsGeoJson = {
      features: [
        {
          geometry: {
            coordinates: [
              [135.195833, 34.694722],
              [135.1863, 34.6826],
            ],
          },
          properties: { summary: { distance: 1234.5, duration: 900 } },
        },
      ],
    };

    const result = parseOrsGeoJson(json);

    expect(result.coordinates).toEqual([
      { latitude: 34.694722, longitude: 135.195833 },
      { latitude: 34.6826, longitude: 135.1863 },
    ]);
    expect(result.distanceMeters).toBe(1234.5);
    expect(result.durationSeconds).toBe(900);
  });

  it('features が空でも安全に空の結果を返す', () => {
    expect(parseOrsGeoJson({})).toEqual({
      coordinates: [],
      distanceMeters: 0,
      durationSeconds: 0,
    });
    expect(parseOrsGeoJson({ features: [] })).toEqual({
      coordinates: [],
      distanceMeters: 0,
      durationSeconds: 0,
    });
  });

  it('summary 欠落時は距離・時間を 0 で補完する', () => {
    const json: OrsGeoJson = {
      features: [{ geometry: { coordinates: [[135.0, 34.0]] } }],
    };

    const result = parseOrsGeoJson(json);

    expect(result.coordinates).toEqual([{ latitude: 34.0, longitude: 135.0 }]);
    expect(result.distanceMeters).toBe(0);
    expect(result.durationSeconds).toBe(0);
  });
});
