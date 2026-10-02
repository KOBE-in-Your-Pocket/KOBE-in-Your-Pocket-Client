import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { SPOTS_QUERY_KEY } from '@/features/tourism/application/use-spots';
import { SPOT_REVIEWS_QUERY_KEY } from '@/features/tourism/application/use-spot-reviews';
import { useReviewStore } from '@/features/tourism/store/use-review-store';
import { ApiError } from '@/shared/lib/api';

import { useAuthStore } from '../../store/use-auth-store';
import { resetSessionGenerationForTests } from '../session-operation';
import { performDeleteAccount, useDeleteAccount } from '../use-delete-account';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/user-api', () => ({
  fetchCurrentUser: jest.fn(),
  deleteCurrentUser: jest.fn(),
}));

jest.mock('../../infrastructure/storage/session-storage', () => ({
  savePersistedSession: jest.fn(),
  loadPersistedSession: jest.fn(),
  updatePersistedUser: jest.fn(),
  clearPersistedSession: jest.fn(),
}));

const EXISTING_REVIEW = {
  id: 'review-1',
  rating: { value: 4 },
  comment: 'コメント',
  author: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
  postedAt: '2026-09-01T00:00:00Z',
  language: 'ja' as const,
};

describe('performDeleteAccount', () => {
  const deleteCurrentUser = jest.fn();
  const fetchCurrentUser = jest.fn();
  const clearPersistedSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    useAuthStore.setState({
      currentUser: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    useReviewStore.setState({ submittedReviews: { 'spot-a': [EXISTING_REVIEW] } });
    deleteCurrentUser.mockResolvedValue(undefined);
    clearPersistedSession.mockResolvedValue(undefined);
    (GoogleSignin.signOut as jest.Mock).mockResolvedValue(null);
  });

  function run() {
    return performDeleteAccount({
      userGateway: { fetchCurrentUser, deleteCurrentUser },
      sessionStore: {
        savePersistedSession: jest.fn(),
        loadPersistedSession: jest.fn(),
        clearPersistedSession,
      },
    });
  }

  it('成功時に削除 API・Google サインアウト・永続化削除・ストア初期化を行い、投稿のあったスポット ID を返す', async () => {
    await expect(run()).resolves.toEqual(['spot-a']);

    expect(deleteCurrentUser).toHaveBeenCalled();
    expect(GoogleSignin.signOut).toHaveBeenCalled();
    expect(clearPersistedSession).toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useReviewStore.getState().submittedReviews).toEqual({});
  });

  it('404（すでに削除済み）は成功扱いにしてローカル状態を初期化する', async () => {
    deleteCurrentUser.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'User not found'));

    await run();

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useReviewStore.getState().submittedReviews).toEqual({});
  });

  it('削除 API が失敗（404 以外）したらローカル状態を変更せずエラーを伝播する', async () => {
    deleteCurrentUser.mockRejectedValue(new Error('network down'));

    await expect(run()).rejects.toThrow('network down');

    expect(useAuthStore.getState().currentUser).not.toBeNull();
    expect(useReviewStore.getState().submittedReviews['spot-a']).toHaveLength(1);
    expect(GoogleSignin.signOut).not.toHaveBeenCalled();
    expect(clearPersistedSession).not.toHaveBeenCalled();
  });

  it('404 以外の ApiError も成功扱いにせずローカル状態を変更しない', async () => {
    deleteCurrentUser.mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'Unauthorized'));

    await expect(run()).rejects.toBeInstanceOf(ApiError);

    expect(useAuthStore.getState().currentUser).not.toBeNull();
  });

  it('Google Sign-In 失敗時もローカルの後始末を完了する', async () => {
    (GoogleSignin.signOut as jest.Mock).mockRejectedValue(new Error('not configured'));

    await run();

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useReviewStore.getState().submittedReviews).toEqual({});
  });

  it('SecureStore 削除失敗時もローカルログアウトは完了する', async () => {
    clearPersistedSession.mockRejectedValue(new Error('secure-store failed'));

    await expect(run()).rejects.toThrow('secure-store failed');

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useReviewStore.getState().submittedReviews).toEqual({});
  });
});

describe('useDeleteAccount', () => {
  const deleteCurrentUserMock = jest.requireMock('../../infrastructure/api/user-api')
    .deleteCurrentUser as jest.Mock;
  const clearPersistedSessionMock = jest.requireMock('../../infrastructure/storage/session-storage')
    .clearPersistedSession as jest.Mock;

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

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
    useReviewStore.setState({ submittedReviews: { 'spot-a': [EXISTING_REVIEW] } });
    deleteCurrentUserMock.mockResolvedValue(undefined);
    clearPersistedSessionMock.mockResolvedValue(undefined);
    (GoogleSignin.signOut as jest.Mock).mockResolvedValue(null);
  });

  it('成功したら投稿のあったスポットのレビュー一覧・評価件数のキャッシュを無効化する', async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, 'spot-a'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: SPOTS_QUERY_KEY });
  });

  it('投稿が無ければキャッシュ無効化は呼ばない', async () => {
    useReviewStore.setState({ submittedReviews: {} });
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteAccount(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
