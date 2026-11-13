import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { fetchWeather } from '../../infrastructure/api/weather-api';
import { useWeather } from '../use-weather';

jest.mock('../../infrastructure/api/weather-api', () => ({
  fetchWeather: jest.fn(),
}));

const mockFetchWeather = jest.mocked(fetchWeather);

const WEATHER = {
  fetchedAt: '2026-11-12T05:39:55Z',
  observation: { at: '2026-11-12T05:35:00Z', mmPerHour: 1.65 },
  forecasts: [{ at: '2026-11-12T05:45:00Z', mmPerHour: 0.85 }],
};

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
  beforeEach(() => {
    mockFetchWeather.mockReset();
  });

  it('取得関数の天気データが取れる', async () => {
    mockFetchWeather.mockResolvedValue(WEATHER);

    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(WEATHER);
  });

  it('取得に失敗すると isError になる', async () => {
    mockFetchWeather.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
