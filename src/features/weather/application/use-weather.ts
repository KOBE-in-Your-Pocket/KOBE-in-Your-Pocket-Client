import { useQuery } from '@tanstack/react-query';

import { fetchWeather } from '../infrastructure/api/weather-api';

export const WEATHER_QUERY_KEY = ['weather'] as const;

// backend のバッチ周期に合わせる
const WEATHER_STALE_TIME_MS = 15 * 60 * 1000;

export function useWeather() {
  return useQuery({
    queryKey: WEATHER_QUERY_KEY,
    queryFn: fetchWeather,
    staleTime: WEATHER_STALE_TIME_MS,
  });
}
