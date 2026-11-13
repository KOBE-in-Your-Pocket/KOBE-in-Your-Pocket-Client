import { parseWeatherTime, type Weather } from './weather';

// 天気マークの種類。API から晴れ・曇りはわからないため、判定は降水強度だけで行う。
// 画面では noRain を「晴れ」、rainSoon を「曇り」として出す（#783）
export type WeatherMarkKind = 'noRain' | 'rainSoon' | 'lightRain' | 'rain' | 'heavyRain';

// 区切りの値（mm/h）。気象庁の雨の強さの呼び方を目安にしている
export const RAIN_THRESHOLD_MM_PER_HOUR = 3;
export const HEAVY_RAIN_THRESHOLD_MM_PER_HOUR = 10;

// 「まもなく雨」とみなす予測の範囲（観測時刻から）
export const RAIN_SOON_WINDOW_MS = 60 * 60 * 1000;

// 今の観測値と 60 分先までの予測値から天気マークの種類を決める
export function getWeatherMarkKind(weather: Weather): WeatherMarkKind {
  const current = weather.observation.mmPerHour;

  if (current >= HEAVY_RAIN_THRESHOLD_MM_PER_HOUR) {
    return 'heavyRain';
  }
  if (current >= RAIN_THRESHOLD_MM_PER_HOUR) {
    return 'rain';
  }
  if (current > 0) {
    return 'lightRain';
  }

  return hasRainSoon(weather) ? 'rainSoon' : 'noRain';
}

function hasRainSoon({ observation, forecasts }: Weather): boolean {
  const observedAt = parseWeatherTime(observation.at);

  return forecasts.some((forecast) => {
    if (forecast.mmPerHour <= 0) {
      return false;
    }
    // 時刻が読めないときは、範囲の外と決めつけず予測として扱う
    const forecastAt = parseWeatherTime(forecast.at);
    if (observedAt === null || forecastAt === null) {
      return true;
    }
    return forecastAt - observedAt <= RAIN_SOON_WINDOW_MS;
  });
}
