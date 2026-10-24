import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useAuthStore } from '../../store/use-auth-store';
import { resetSessionGenerationForTests } from '../session-operation';
import { useSignOut } from '../use-sign-out';
import { CURRENT_USER_QUERY_KEY, useSyncCurrentUser } from '../use-sync-current-user';
import { useUpdateProfile } from '../use-update-profile';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/user-api', () => ({
  fetchCurrentUser: jest.fn(),
  updateCurrentUser: jest.fn(),
  uploadMyIcon: jest.fn(),
  deleteCurrentUser: jest.fn(),
}));

jest.mock('../../infrastructure/api/auth-api', () => ({
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signUpWithEmail: jest.fn(),
  signInWithEmail: jest.fn(),
  refreshAuthSession: jest.fn(),
  logoutAuthSession: jest.fn(),
}));

jest.mock('../../infrastructure/storage/session-storage', () => ({
  savePersistedSession: jest.fn(),
  loadPersistedSession: jest.fn(),
  updatePersistedUser: jest.fn(),
  clearPersistedSession: jest.fn(),
}));

const OLD_USER = { id: 'user-1', name: 'a1b2c3d4e5', iconUrl: '' };
const RENAMED_USER = { id: 'user-1', name: '新しい名前', iconUrl: '' };
const USER_KEY = [...CURRENT_USER_QUERY_KEY, 'user-1'];

const userApi = jest.requireMock('../../infrastructure/api/user-api') as {
  fetchCurrentUser: jest.Mock;
  updateCurrentUser: jest.Mock;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

/**
 * 表示名を変えたのに、再ログインや画面の再マウントで変更前の名前に戻る不具合の回帰テスト。
 * useSyncCurrentUser の古いキャッシュがストアへ書き戻されないことを確かめる。
 */
describe('現在ユーザーのキャッシュ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    useAuthStore.setState({
      currentUser: OLD_USER,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    userApi.fetchCurrentUser.mockResolvedValue(OLD_USER);
    userApi.updateCurrentUser.mockResolvedValue(RENAMED_USER);
    (GoogleSignin.signOut as jest.Mock).mockResolvedValue(null);
  });

  it('表示名の保存に成功したら、キャッシュも保存後の値になる', async () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(USER_KEY, OLD_USER);
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });

    result.current.mutate({ name: '新しい名前', iconUrl: '' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(USER_KEY)).toEqual(RENAMED_USER);
  });

  it('保存後に同期 hook が再マウントされても、変更前の名前に戻らない', async () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(USER_KEY, OLD_USER);
    const { result } = renderHook(() => useUpdateProfile(), { wrapper });
    result.current.mutate({ name: '新しい名前', iconUrl: '' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    renderHook(() => useSyncCurrentUser(), { wrapper });

    await waitFor(() => expect(useAuthStore.getState().currentUser).toEqual(RENAMED_USER));
  });

  it('ログアウトしたら現在ユーザーのキャッシュを捨てる', async () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(USER_KEY, OLD_USER);
    const { result } = renderHook(() => useSignOut(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(USER_KEY)).toBeUndefined();
  });
});
