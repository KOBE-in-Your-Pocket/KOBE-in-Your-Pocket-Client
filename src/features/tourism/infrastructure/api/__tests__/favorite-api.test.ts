import { ApiError, apiFetch } from '@/shared/lib/api';

import { addFavorite, fetchFavorites, removeFavorite } from '../favorite-api';

// ApiError は投げ直されることの確認に使うため本物を残し、apiFetch だけ差し替える。
jest.mock('@/shared/lib/api', () => ({
  ...jest.requireActual('@/shared/lib/api'),
  apiFetch: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);

beforeEach(() => {
  mockApiFetch.mockReset();
});

describe('fetchFavorites', () => {
  it('トークンを付けて GET し、応答の配列をそのまま返す', async () => {
    const favorites = [
      { spotId: 'kobe-port-tower', createdAt: '2026-11-02T10:00:00.123456Z' },
      { spotId: 'kitano-ijinkan', createdAt: '2026-11-01T10:00:00Z' },
    ];
    mockApiFetch.mockResolvedValue(favorites);

    await expect(fetchFavorites()).resolves.toEqual(favorites);
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me/favorites', { auth: true });
  });

  it('0 件なら空の配列を返す', async () => {
    mockApiFetch.mockResolvedValue([]);

    await expect(fetchFavorites()).resolves.toEqual([]);
  });

  it('未ログイン（401）なら ApiError をそのまま投げる', async () => {
    const error = new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
    mockApiFetch.mockRejectedValue(error);

    await expect(fetchFavorites()).rejects.toBe(error);
  });
});

describe('addFavorite', () => {
  it('トークンを付けて、そのスポットに PUT する', async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await expect(addFavorite('kobe-port-tower')).resolves.toBeUndefined();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me/favorites/kobe-port-tower', {
      method: 'PUT',
      auth: true,
    });
  });

  it('spotId をエンコードしてパスに入れる', async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await addFavorite('spot/with space');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/users/me/favorites/spot%2Fwith%20space',
      expect.anything(),
    );
  });

  it('スポットが無い（404）なら ApiError をそのまま投げる', async () => {
    const error = new ApiError(404, 'NOT_FOUND', 'Spot not found');
    mockApiFetch.mockRejectedValue(error);

    await expect(addFavorite('missing-spot')).rejects.toBe(error);
  });
});

describe('removeFavorite', () => {
  it('トークンを付けて、そのスポットに DELETE する', async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await expect(removeFavorite('kobe-port-tower')).resolves.toBeUndefined();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me/favorites/kobe-port-tower', {
      method: 'DELETE',
      auth: true,
    });
  });

  it('spotId をエンコードしてパスに入れる', async () => {
    mockApiFetch.mockResolvedValue(undefined);

    await removeFavorite('spot/with space');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/users/me/favorites/spot%2Fwith%20space',
      expect.anything(),
    );
  });

  it('未ログイン（401）なら ApiError をそのまま投げる', async () => {
    const error = new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
    mockApiFetch.mockRejectedValue(error);

    await expect(removeFavorite('kobe-port-tower')).rejects.toBe(error);
  });
});
