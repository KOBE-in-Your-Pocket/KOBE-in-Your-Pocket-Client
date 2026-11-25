import { ApiError, apiFetch } from '@/shared/lib/api';

import { createApiSpotViewRepository } from '../api-spot-view-repository';

// ApiError は投げ直されることの確認に使うため本物を残し、apiFetch だけ差し替える。
jest.mock('@/shared/lib/api', () => ({
  ...jest.requireActual('@/shared/lib/api'),
  apiFetch: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);

describe('createApiSpotViewRepository', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('トークンを付けずに、そのスポットの閲覧を POST する', async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await expect(
      createApiSpotViewRepository().recordSpotView('kobe-port-tower'),
    ).resolves.toBeUndefined();
    // auth を付けないこと（期限切れのトークンで 401 にならないよう、公開 API にはトークンを送らない）。
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/tourism/spots/kobe-port-tower/views', {
      method: 'POST',
    });
  });

  it('spotId をエンコードしてパスに入れる', async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await createApiSpotViewRepository().recordSpotView('spot/with space');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/tourism/spots/spot%2Fwith%20space/views',
      expect.anything(),
    );
  });

  it('失敗（429 など）は ApiError のまま投げる', async () => {
    const error = new ApiError(429, 'TOO_MANY_REQUESTS', 'Too Many Requests');
    mockApiFetch.mockRejectedValue(error);

    await expect(createApiSpotViewRepository().recordSpotView('kobe-port-tower')).rejects.toBe(
      error,
    );
  });
});
