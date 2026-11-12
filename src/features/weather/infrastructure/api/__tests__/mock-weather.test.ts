import { createMockWeather, type MockWeatherPattern } from '../mock-weather';

const NOW = new Date('2026-11-12T05:39:55Z');
const PATTERNS: MockWeatherPattern[] = ['none', 'soon', 'light', 'moderate', 'heavy'];

describe('createMockWeather', () => {
  it('観測値は now を 10 分単位で切り捨てた時刻、予測値は 10 分刻みで 6 件', () => {
    const weather = createMockWeather('light', NOW);

    expect(weather.fetchedAt).toBe(NOW.toISOString());
    expect(weather.observation.at).toBe('2026-11-12T05:30:00.000Z');
    expect(weather.forecasts.map((f) => f.at)).toEqual([
      '2026-11-12T05:40:00.000Z',
      '2026-11-12T05:50:00.000Z',
      '2026-11-12T06:00:00.000Z',
      '2026-11-12T06:10:00.000Z',
      '2026-11-12T06:20:00.000Z',
      '2026-11-12T06:30:00.000Z',
    ]);
  });

  it('パターンを切り替えると降水強度が変わる', () => {
    const rainfalls = PATTERNS.map((p) =>
      JSON.stringify(createMockWeather(p, NOW).forecasts.map((f) => f.mmPerHour)),
    );

    expect(new Set(rainfalls).size).toBe(PATTERNS.length);
  });

  it.each<[MockWeatherPattern, (mm: number) => boolean]>([
    ['none', (mm) => mm === 0],
    ['soon', (mm) => mm === 0],
    ['light', (mm) => mm > 0 && mm < 3],
    ['moderate', (mm) => mm >= 3 && mm < 10],
    ['heavy', (mm) => mm >= 10],
  ])('%s の観測値は想定の範囲にある', (pattern, inRange) => {
    expect(inRange(createMockWeather(pattern, NOW).observation.mmPerHour)).toBe(true);
  });

  it('none は予測も雨なし、soon は予測に雨がある', () => {
    expect(createMockWeather('none', NOW).forecasts.every((f) => f.mmPerHour === 0)).toBe(true);
    expect(createMockWeather('soon', NOW).forecasts.some((f) => f.mmPerHour > 0)).toBe(true);
  });
});
