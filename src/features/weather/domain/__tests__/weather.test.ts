import { isWeatherOutdated, parseWeatherTime, type Weather } from '../weather';

describe('parseWeatherTime', () => {
  it.each([
    ['2026-11-12T02:33:37.960679Z', Date.UTC(2026, 10, 12, 2, 33, 37, 960)],
    ['2026-11-12T02:25:00Z', Date.UTC(2026, 10, 12, 2, 25, 0)],
    ['2026-11-12T11:25:00+09:00', Date.UTC(2026, 10, 12, 2, 25, 0)],
    ['2026-11-12T02:25:00.5Z', Date.UTC(2026, 10, 12, 2, 25, 0, 500)],
  ])('%s を読める', (value, expected) => {
    expect(parseWeatherTime(value)).toBe(expected);
  });

  it.each(['', '2026-11-12', '2026-11-12T02:25:00', 'not a date'])('%s は null', (value) => {
    expect(parseWeatherTime(value)).toBeNull();
  });
});

describe('isWeatherOutdated', () => {
  const FETCHED_AT = '2026-11-12T05:39:55Z';
  const fetchedAtMs = Date.UTC(2026, 10, 12, 5, 39, 55);
  const MINUTE_MS = 60 * 1000;

  function buildWeather(fetchedAt: string): Weather {
    return {
      fetchedAt,
      observation: { at: '2026-11-12T05:35:00Z', mmPerHour: 0 },
      forecasts: [],
    };
  }

  it.each([
    ['取得直後', 0, false],
    ['ちょうど 30 分後', 30 * MINUTE_MS, false],
    ['30 分を過ぎたとき', 30 * MINUTE_MS + 1, true],
  ])('%s は %s', (_, elapsedMs, expected) => {
    expect(isWeatherOutdated(buildWeather(FETCHED_AT), fetchedAtMs + elapsedMs)).toBe(expected);
  });

  it('fetchedAt が読めないときは古いとみなす', () => {
    expect(isWeatherOutdated(buildWeather('not a date'), fetchedAtMs)).toBe(true);
  });
});
