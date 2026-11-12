import type { Rainfall, Weather } from '../../domain/weather';

export type MockWeatherPattern = 'none' | 'soon' | 'light' | 'moderate' | 'heavy';

// 表示を確認したいパターンに書き換える
export const MOCK_WEATHER_PATTERN: MockWeatherPattern = 'light';

// 観測値と 10 分刻みの予測値 6 件の降水強度（mm/h）
const RAINFALLS: Record<MockWeatherPattern, number[]> = {
  none: [0, 0, 0, 0, 0, 0, 0],
  soon: [0, 0, 0.85, 1.65, 2.4, 2.4, 1.2],
  light: [1.65, 1.2, 0.85, 0.85, 0.4, 0, 0],
  moderate: [6.5, 7.2, 5.8, 4.1, 3.3, 2.0, 1.1],
  heavy: [18.0, 22.5, 15.3, 12.0, 8.4, 5.0, 2.2],
};

const TEN_MINUTES_MS = 10 * 60 * 1000;

// now を基準に時刻を作るので、fetchedAt が古いと判定されない
export function createMockWeather(pattern: MockWeatherPattern, now = new Date()): Weather {
  const observedAt = Math.floor(now.getTime() / TEN_MINUTES_MS) * TEN_MINUTES_MS;
  const [observation, ...forecasts] = RAINFALLS[pattern].map(
    (mmPerHour, i): Rainfall => ({
      at: new Date(observedAt + i * TEN_MINUTES_MS).toISOString(),
      mmPerHour,
    }),
  );

  return { fetchedAt: now.toISOString(), observation, forecasts };
}
