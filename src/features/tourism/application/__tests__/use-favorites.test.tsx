import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { fetchFavorites } from '../../infrastructure/api/favorite-api';
import { favoritesQueryKey, useFavorites, useIsFavorite } from '../use-favorites';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/favorite-api', () => ({
  fetchFavorites: jest.fn(),
}));

jest.mock('@/features/user/application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockCurrentUser = jest.fn();
const fetchFavoritesMock = fetchFavorites as jest.Mock;

const USER = { id: 'user-1', name: '太郎', iconUrl: '' };
const FAVORITES = [
  { spotId: 'spot-a', createdAt: '2026-11-02T00:00:00.000Z' },
  { spotId: 'spot-b', createdAt: '2026-11-01T00:00:00.000Z' },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockReturnValue(USER);
    fetchFavoritesMock.mockResolvedValue(FAVORITES);
  });

  it('ログイン中は自分のお気に入りを取得し、ユーザー ID 付きのキーでキャッシュする', async () => {
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useFavorites(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(FAVORITES);
    expect(queryClient.getQueryData(favoritesQueryKey(USER.id))).toEqual(FAVORITES);
  });

  it('未ログインなら取りに行かない', () => {
    mockCurrentUser.mockReturnValue(null);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    expect(fetchFavoritesMock).not.toHaveBeenCalled();
  });
});

describe('useIsFavorite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockReturnValue(USER);
    fetchFavoritesMock.mockResolvedValue(FAVORITES);
  });

  it('お気に入りのスポットなら true', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useIsFavorite('spot-a'), { wrapper });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('お気に入りでないスポットなら false', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useIsFavorite('spot-z'), { wrapper });

    await waitFor(() => expect(fetchFavoritesMock).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it('未ログインなら false', () => {
    mockCurrentUser.mockReturnValue(null);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useIsFavorite('spot-a'), { wrapper });

    expect(result.current).toBe(false);
  });
});
