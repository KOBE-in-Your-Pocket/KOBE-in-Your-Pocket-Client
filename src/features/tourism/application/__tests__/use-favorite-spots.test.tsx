import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { fetchFavorites } from '../../infrastructure/api/favorite-api';
import { fetchSpots } from '../../infrastructure/api/spot-api';
import { useFavoriteSpots } from '../use-favorite-spots';

import type { Spot } from '../../domain/spot';
import type { PropsWithChildren } from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ja' } }),
}));

jest.mock('../../infrastructure/api/favorite-api', () => ({
  fetchFavorites: jest.fn(),
}));

jest.mock('../../infrastructure/api/spot-api', () => ({
  fetchSpots: jest.fn(),
}));

jest.mock('@/features/user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

// 中で使う useFavorites は user の内部ファイルから読む（user 側が useFavorites を
// 読むため、公開 API にすると循環する）ので、こちらも同じユーザーを返す。
jest.mock('@/features/user/application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockCurrentUser = jest.fn();
const fetchFavoritesMock = jest.mocked(fetchFavorites);
const fetchSpotsMock = jest.mocked(fetchSpots);

const USER = { id: 'user-1', name: '太郎', iconUrl: '' };

function makeSpot(id: string): Spot {
  return {
    id,
    name: id,
    description: '',
    address: '',
    businessHours: '',
    genre: 'landmark',
    category: { label: '' },
    media: { imageUrl: '' },
    coordinates: { latitude: 0, longitude: 0 },
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return wrapper;
}

describe('useFavoriteSpots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockReturnValue(USER);
    fetchFavoritesMock.mockResolvedValue([
      { spotId: 'spot-a', createdAt: '2026-11-01T00:00:00.000Z' },
      { spotId: 'spot-b', createdAt: '2026-11-02T00:00:00.000Z' },
    ]);
    fetchSpotsMock.mockResolvedValue([makeSpot('spot-a'), makeSpot('spot-b'), makeSpot('spot-c')]);
  });

  it('お気に入りのスポットだけを、登録の新しい順で返す', async () => {
    const { result } = renderHook(() => useFavoriteSpots(), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data?.map((spot) => spot.id)).toEqual(['spot-b', 'spot-a']);
    expect(result.current.isError).toBe(false);
  });

  it('スポット一覧の取得に失敗したらエラーにする', async () => {
    fetchSpotsMock.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useFavoriteSpots(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('お気に入りの取得に失敗したらエラーにする', async () => {
    fetchFavoritesMock.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useFavoriteSpots(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('未ログインなら読み込み中にせず、空の一覧を返す', () => {
    mockCurrentUser.mockReturnValue(null);
    const { result } = renderHook(() => useFavoriteSpots(), { wrapper: createWrapper() });

    expect(result.current).toMatchObject({ data: [], isPending: false, isError: false });
    expect(fetchFavoritesMock).not.toHaveBeenCalled();
  });

  it('refetch でお気に入りとスポット一覧の両方を取り直す', async () => {
    const { result } = renderHook(() => useFavoriteSpots(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isPending).toBe(false));

    await act(() => result.current.refetch());

    expect(fetchFavoritesMock).toHaveBeenCalledTimes(2);
    expect(fetchSpotsMock).toHaveBeenCalledTimes(2);
  });
});
