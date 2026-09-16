import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useAuthStore } from '../../store/use-auth-store';
import { resetSessionGenerationForTests } from '../session-operation';
import { applyCurrentUser, useSyncCurrentUser } from '../use-sync-current-user';

import type { PersistedUserStore, UserGateway } from '../../domain/auth-ports';
import type { PropsWithChildren } from 'react';

const USER = { id: 'user-1', name: '荒川蓮', iconUrl: '' };
const SERVER_USER = { id: 'user-1', name: '荒川 蓮（更新後）', iconUrl: 'https://cdn/icon.png' };

function createDeps() {
  return {
    userGateway: { fetchCurrentUser: jest.fn() } as unknown as UserGateway,
    persistedUserStore: {
      updatePersistedUser: jest.fn().mockResolvedValue(undefined),
    } as unknown as PersistedUserStore,
  };
}

/**
 * gcTime を 0 にするのは、キャッシュ回収のタイマーがテスト終了後も残って
 * jest がプロセスを終了できなくなるのを防ぐため。
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return wrapper;
}

describe('applyCurrentUser', () => {
  let persistedUserStore: PersistedUserStore;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    persistedUserStore = createDeps().persistedUserStore;
    useAuthStore.setState({ currentUser: USER, accessToken: 'token', refreshToken: 'refresh' });
  });

  it('認証ストアと永続化済みセッションへ反映する', async () => {
    await applyCurrentUser(SERVER_USER, persistedUserStore);

    expect(useAuthStore.getState().currentUser).toEqual(SERVER_USER);
    expect(persistedUserStore.updatePersistedUser).toHaveBeenCalledWith(SERVER_USER);
  });

  it('ログイン状態（トークン）は保ったままユーザーだけ更新する', async () => {
    await applyCurrentUser(SERVER_USER, persistedUserStore);

    expect(useAuthStore.getState().accessToken).toBe('token');
    expect(useAuthStore.getState().refreshToken).toBe('refresh');
  });

  it('取得後にログアウトしていたら反映しない', async () => {
    useAuthStore.getState().logout();

    await applyCurrentUser(SERVER_USER, persistedUserStore);

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(persistedUserStore.updatePersistedUser).not.toHaveBeenCalled();
  });

  it('取得後に別ユーザーへ切り替わっていたら反映しない', async () => {
    const other = { id: 'user-2', name: '山田花子', iconUrl: '' };
    useAuthStore.getState().login(other);

    await applyCurrentUser(SERVER_USER, persistedUserStore);

    expect(useAuthStore.getState().currentUser).toEqual(other);
    expect(persistedUserStore.updatePersistedUser).not.toHaveBeenCalled();
  });

  it('永続化に失敗してもメモリ上の反映は維持する', async () => {
    (persistedUserStore.updatePersistedUser as jest.Mock).mockRejectedValue(new Error('keychain'));

    await expect(applyCurrentUser(SERVER_USER, persistedUserStore)).resolves.toBeUndefined();
    expect(useAuthStore.getState().currentUser).toEqual(SERVER_USER);
  });
});

describe('useSyncCurrentUser', () => {
  let deps: ReturnType<typeof createDeps>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    deps = createDeps();
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });
  });

  it('未ログイン時は取得しない', async () => {
    renderHook(() => useSyncCurrentUser(deps), { wrapper: createWrapper() });

    await waitFor(() => expect(deps.userGateway.fetchCurrentUser).not.toHaveBeenCalled());
  });

  it('ログイン中はサーバーの現在ユーザーを取得してストアへ反映する', async () => {
    useAuthStore.setState({ currentUser: USER, accessToken: 'token', refreshToken: 'refresh' });
    (deps.userGateway.fetchCurrentUser as jest.Mock).mockResolvedValue(SERVER_USER);

    renderHook(() => useSyncCurrentUser(deps), { wrapper: createWrapper() });

    await waitFor(() => expect(useAuthStore.getState().currentUser).toEqual(SERVER_USER));
    expect(deps.persistedUserStore.updatePersistedUser).toHaveBeenCalledWith(SERVER_USER);
  });

  it('取得に失敗してもローカルのユーザー情報を使い続ける', async () => {
    useAuthStore.setState({ currentUser: USER, accessToken: 'token', refreshToken: 'refresh' });
    (deps.userGateway.fetchCurrentUser as jest.Mock).mockRejectedValue(new Error('network down'));

    renderHook(() => useSyncCurrentUser(deps), { wrapper: createWrapper() });

    await waitFor(() => expect(deps.userGateway.fetchCurrentUser).toHaveBeenCalled());
    expect(useAuthStore.getState().currentUser).toEqual(USER);
  });
});
