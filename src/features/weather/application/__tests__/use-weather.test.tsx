import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { MOCK_WEATHER_PATTERN, createMockWeather } from '../../infrastructure/api/mock-weather';
import { useWeather } from '../use-weather';

import type { Weather } from '../../domain/weather';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return Wrapper;
}

describe('useWeather', () => {
  it('モックの天気データが取れる', async () => {
    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const rainfalls = (w: Weather) => [w.observation, ...w.forecasts].map((r) => r.mmPerHour);
    expect(rainfalls(result.current.data as Weather)).toEqual(
      rainfalls(createMockWeather(MOCK_WEATHER_PATTERN)),
    );
  });
});
