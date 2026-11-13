import type { Rainfall, Weather } from '../weather';
import { getWeatherMarkKind } from '../weather-mark';

const OBSERVED_AT = '2026-11-12T02:25:00Z';

function minutesLater(minutes: number): string {
  return new Date(Date.parse(OBSERVED_AT) + minutes * 60 * 1000).toISOString();
}

function buildWeather(current: number, forecastValues: number[] = []): Weather {
  const forecasts: Rainfall[] = forecastValues.map((mmPerHour, index) => ({
    at: minutesLater((index + 1) * 10),
    mmPerHour,
  }));

  return {
    fetchedAt: OBSERVED_AT,
    observation: { at: OBSERVED_AT, mmPerHour: current },
    forecasts,
  };
}

describe('getWeatherMarkKind', () => {
  it.each([
    [0, 'noRain'],
    [0.01, 'lightRain'],
    [2.99, 'lightRain'],
    [3, 'rain'],
    [9.99, 'rain'],
    [10, 'heavyRain'],
    [50, 'heavyRain'],
  ] as const)('今の降水強度が %s mm/h なら %s', (current, expected) => {
    expect(getWeatherMarkKind(buildWeather(current, [0, 0, 0, 0, 0, 0]))).toBe(expected);
  });

  it('今も 60 分先まで 0 なら雨なし', () => {
    expect(getWeatherMarkKind(buildWeather(0, [0, 0, 0, 0, 0, 0]))).toBe('noRain');
  });

  it('予測が 0 件で今も 0 なら雨なし', () => {
    expect(getWeatherMarkKind(buildWeather(0, []))).toBe('noRain');
  });

  it('予測にだけ雨があるとまもなく雨', () => {
    expect(getWeatherMarkKind(buildWeather(0, [0, 0, 0, 0, 0, 0.01]))).toBe('rainSoon');
  });

  it('今雨が降っていれば、予測の雨より今の強さを優先する', () => {
    expect(getWeatherMarkKind(buildWeather(1, [20, 20]))).toBe('lightRain');
  });

  it('ちょうど 60 分後の予測の雨はまもなく雨に含める', () => {
    const weather: Weather = {
      ...buildWeather(0),
      forecasts: [{ at: minutesLater(60), mmPerHour: 1 }],
    };
    expect(getWeatherMarkKind(weather)).toBe('rainSoon');
  });

  it('60 分より先の予測の雨は数えない', () => {
    const weather: Weather = {
      ...buildWeather(0),
      forecasts: [{ at: minutesLater(70), mmPerHour: 1 }],
    };
    expect(getWeatherMarkKind(weather)).toBe('noRain');
  });

  it('時刻が読めない予測の雨もまもなく雨として扱う', () => {
    const weather: Weather = {
      ...buildWeather(0),
      forecasts: [{ at: 'not a date', mmPerHour: 1 }],
    };
    expect(getWeatherMarkKind(weather)).toBe('rainSoon');
  });
});
