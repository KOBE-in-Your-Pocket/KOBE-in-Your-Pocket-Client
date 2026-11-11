import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { addFavorite, fetchFavorites, removeFavorite } from '../../infrastructure/api/favorite-api';
import { favoritesQueryKey } from '../use-favorites';
import { useToggleFavorite } from '../use-toggle-favorite';

import type { Favorite } from '../../domain/favorite';
import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/favorite-api', () => ({
  fetchFavorites: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

jest.mock('@/features/user/application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockCurrentUser = jest.fn();
const fetchFavoritesMock = fetchFavorites as jest.Mock;
const addFavoriteMock = addFavorite as jest.Mock;
const removeFavoriteMock = removeFavorite as jest.Mock;

const USER = { id: 'user-1', name: '太郎', iconUrl: '' };
const KEY = favoritesQueryKey(USER.id);
const INITIAL: Favorite[] = [{ spotId: 'spot-a', createdAt: '2026-11-01T00:00:00.000Z' }];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(KEY, INITIAL);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

function spotIds(queryClient: QueryClient) {
  return queryClient.getQueryData<Favorite[]>(KEY)?.map((f) => f.spotId);
}

/** 呼ばれても終わらない Promise と、それを終わらせる関数。 */
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useToggleFavorite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockReturnValue(USER);
    fetchFavoritesMock.mockResolvedValue(INITIAL);
  });

  it('追加は API の完了を待たずに一覧へ先頭で反映する（楽観的更新）', async () => {
    const pending = deferred();
    addFavoriteMock.mockReturnValue(pending.promise);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.mutate({ spotId: 'spot-b', next: true }));

    await waitFor(() => expect(spotIds(queryClient)).toEqual(['spot-b', 'spot-a']));
    expect(addFavoriteMock).toHaveBeenCalledWith('spot-b');

    await act(async () => pending.resolve());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('削除は API の完了を待たずに一覧から消す（楽観的更新）', async () => {
    const pending = deferred();
    removeFavoriteMock.mockReturnValue(pending.promise);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.mutate({ spotId: 'spot-a', next: false }));

    await waitFor(() => expect(spotIds(queryClient)).toEqual([]));
    expect(removeFavoriteMock).toHaveBeenCalledWith('spot-a');

    await act(async () => pending.resolve());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('追加に失敗したら一覧を元に戻す', async () => {
    addFavoriteMock.mockRejectedValue(new Error('network'));
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.mutate({ spotId: 'spot-b', next: true }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spotIds(queryClient)).toEqual(['spot-a']);
  });

  it('削除に失敗したら一覧を元に戻す', async () => {
    removeFavoriteMock.mockRejectedValue(new Error('network'));
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.mutate({ spotId: 'spot-a', next: false }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spotIds(queryClient)).toEqual(['spot-a']);
  });

  it('終わったら一覧を取り直してサーバーの状態に揃える', async () => {
    addFavoriteMock.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.mutate({ spotId: 'spot-b', next: true }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: KEY });
  });

  it('ほかの操作がまだ途中なら取り直さず、最後の操作が終わったときに取り直す', async () => {
    const first = deferred();
    const second = deferred();
    addFavoriteMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result: a } = renderHook(() => useToggleFavorite(), { wrapper });
    const { result: b } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => a.current.mutate({ spotId: 'spot-b', next: true }));
    act(() => b.current.mutate({ spotId: 'spot-c', next: true }));
    await waitFor(() => expect(addFavoriteMock).toHaveBeenCalledTimes(2));

    await act(async () => first.resolve());
    await waitFor(() => expect(a.current.isSuccess).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
    expect(spotIds(queryClient)).toEqual(['spot-c', 'spot-b', 'spot-a']);

    await act(async () => second.resolve());
    await waitFor(() => expect(b.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: KEY });
  });

  it('未ログインなら API を呼ばずに失敗する', async () => {
    mockCurrentUser.mockReturnValue(null);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    act(() => result.current.mutate({ spotId: 'spot-b', next: true }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(addFavoriteMock).not.toHaveBeenCalled();
  });
});
