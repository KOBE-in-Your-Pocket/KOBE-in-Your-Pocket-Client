import { ApiError, apiFetch } from '@/shared/lib/api';

import { fetchWeather } from '../weather-api';

jest.mock('@/shared/lib/api', () => ({
  ...jest.requireActual('@/shared/lib/api'),
  apiFetch: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);

const WEATHER = {
  fetchedAt: '2026-11-12T05:39:55Z',
  observation: { at: '2026-11-12T05:35:00Z', mmPerHour: 1.65 },
  forecasts: [{ at: '2026-11-12T05:45:00Z', mmPerHour: 0.85 }],
};

describe('fetchWeather', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('GET /api/v1/weather のレスポンスをそのまま返す', async () => {
    mockApiFetch.mockResolvedValue(WEATHER);

    await expect(fetchWeather()).resolves.toEqual(WEATHER);
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/weather');
  });

  it('204（まだ取得できていない）は null を返す', async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await expect(fetchWeather()).resolves.toBeNull();
  });

  it('エラーはそのまま投げる', async () => {
    mockApiFetch.mockRejectedValue(new ApiError(500, 'INTERNAL', 'error'));

    await expect(fetchWeather()).rejects.toBeInstanceOf(ApiError);
  });
});
