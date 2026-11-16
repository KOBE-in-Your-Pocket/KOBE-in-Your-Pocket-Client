import { parseWeatherTime } from '../weather';

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
