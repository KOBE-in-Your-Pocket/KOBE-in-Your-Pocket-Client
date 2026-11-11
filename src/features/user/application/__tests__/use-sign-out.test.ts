import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type PropsWithChildren } from 'react';

import { favoritesQueryKey } from '@/features/tourism/application/use-favorites';

import { useAuthStore } from '../../store/use-auth-store';
import { resetSessionGenerationForTests } from '../session-operation';
import { performSignOut, useSignOut } from '../use-sign-out';

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

describe('performSignOut', () => {
  const logoutAuthSession = jest.fn();
  const clearPersistedSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    useAuthStore.setState({
      currentUser: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    logoutAuthSession.mockResolvedValue(undefined);
    clearPersistedSession.mockResolvedValue(undefined);
    (GoogleSignin.signOut as jest.Mock).mockResolvedValue(null);
  });

  it('成功時に backend ログアウト・Google サインアウト・永続化削除・ストア更新を行う', async () => {
    await performSignOut({
      authGateway: {
        signInWithGoogle: jest.fn(),
        signInWithApple: jest.fn(),
        signUpWithEmail: jest.fn(),
        signInWithEmail: jest.fn(),
        refreshAuthSession: jest.fn(),
        logoutAuthSession,
      },
      sessionStore: {
        savePersistedSession: jest.fn(),
        loadPersistedSession: jest.fn(),
        clearPersistedSession,
      },
    });

    expect(logoutAuthSession).toHaveBeenCalledWith('access-token');
    expect(GoogleSignin.signOut).toHaveBeenCalled();
    expect(clearPersistedSession).toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('backend ログアウト失敗時もローカルログアウトを完了する', async () => {
    logoutAuthSession.mockRejectedValue(new Error('offline'));

    await performSignOut({
      authGateway: {
        signInWithGoogle: jest.fn(),
        signInWithApple: jest.fn(),
        signUpWithEmail: jest.fn(),
        signInWithEmail: jest.fn(),
        refreshAuthSession: jest.fn(),
        logoutAuthSession,
      },
      sessionStore: {
        savePersistedSession: jest.fn(),
        loadPersistedSession: jest.fn(),
        clearPersistedSession,
      },
    });

    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('Google Sign-In 失敗時もローカルログアウトを完了する', async () => {
    (GoogleSignin.signOut as jest.Mock).mockRejectedValue(new Error('not configured'));

    await performSignOut({
      authGateway: {
        signInWithGoogle: jest.fn(),
        signInWithApple: jest.fn(),
        signUpWithEmail: jest.fn(),
        signInWithEmail: jest.fn(),
        refreshAuthSession: jest.fn(),
        logoutAuthSession,
      },
      sessionStore: {
        savePersistedSession: jest.fn(),
        loadPersistedSession: jest.fn(),
        clearPersistedSession,
      },
    });

    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('SecureStore 削除失敗時もローカルログアウトを完了する', async () => {
    clearPersistedSession.mockRejectedValue(new Error('secure-store failed'));

    await expect(
      performSignOut({
        authGateway: {
          signInWithGoogle: jest.fn(),
          signInWithApple: jest.fn(),
          signUpWithEmail: jest.fn(),
          signInWithEmail: jest.fn(),
          refreshAuthSession: jest.fn(),
          logoutAuthSession,
        },
        sessionStore: {
          savePersistedSession: jest.fn(),
          loadPersistedSession: jest.fn(),
          clearPersistedSession,
        },
      }),
    ).rejects.toThrow('secure-store failed');

    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});

describe('useSignOut', () => {
  const logoutAuthSessionMock = jest.requireMock('../../infrastructure/api/auth-api')
    .logoutAuthSession as jest.Mock;
  const clearPersistedSessionMock = jest.requireMock('../../infrastructure/storage/session-storage')
    .clearPersistedSession as jest.Mock;

  const FAVORITES = [{ spotId: 'spot-a', createdAt: '2026-11-01T00:00:00.000Z' }];

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(favoritesQueryKey('user-1'), FAVORITES);
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    return { queryClient, wrapper };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    useAuthStore.setState({
      currentUser: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    logoutAuthSessionMock.mockResolvedValue(undefined);
    clearPersistedSessionMock.mockResolvedValue(undefined);
    (GoogleSignin.signOut as jest.Mock).mockResolvedValue(null);
  });

  it('お気に入りのキャッシュを消す（#790）', async () => {
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useSignOut(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(favoritesQueryKey('user-1'))).toBeUndefined();
  });

  it('backend ログアウトが失敗してもお気に入りのキャッシュを消す', async () => {
    logoutAuthSessionMock.mockRejectedValue(new Error('offline'));
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useSignOut(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(favoritesQueryKey('user-1'))).toBeUndefined();
  });

  it('端末のセッション削除に失敗してもお気に入りのキャッシュを消す', async () => {
    clearPersistedSessionMock.mockRejectedValue(new Error('secure-store failed'));
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useSignOut(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(favoritesQueryKey('user-1'))).toBeUndefined();
  });
});
