import type { WeatherMarkKind } from '../../domain/weather-mark';

/** 天気マークの種類 → 同梱のマーク画像。 */
export const WEATHER_MARK_IMAGE_MAP: Record<WeatherMarkKind, number> = {
  noRain: require('@/assets/images/weather/no-rain.png'),
  rainSoon: require('@/assets/images/weather/rain-soon.png'),
  lightRain: require('@/assets/images/weather/light-rain.png'),
  rain: require('@/assets/images/weather/rain.png'),
  heavyRain: require('@/assets/images/weather/heavy-rain.png'),
};
