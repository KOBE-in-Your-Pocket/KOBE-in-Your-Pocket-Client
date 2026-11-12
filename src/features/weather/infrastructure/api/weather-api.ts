import { apiFetch } from '@/shared/lib/api';

import type { Weather } from '../../domain/weather';

// まだ一度も取得できていないとき backend は 204 を返すので null にする
export async function fetchWeather(): Promise<Weather | null> {
  const weather = await apiFetch<Weather | undefined>('/api/v1/weather');
  return weather ?? null;
}
