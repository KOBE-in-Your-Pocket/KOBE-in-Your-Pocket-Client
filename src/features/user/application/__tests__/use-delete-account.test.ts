import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useReviewStore } from '@/features/tourism/store/use-review-store';
import { ApiError } from '@/shared/lib/api';

import { useAuthStore } from '../../store/use-auth-store';
import { performDeleteAccount } from '../use-delete-account';
import { resetSessionGenerationForTests } from '../session-operation';

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
    useReviewStore.setState({
      submittedReviews: {
        'spot-a': [
          {
            id: 'review-1',
            rating: { value: 4 },
            comment: 'コメント',
            author: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
            postedAt: '2026-09-01T00:00:00Z',
            language: 'ja',
          },
        ],
      },
    });
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

  it('成功時に削除 API・Google サインアウト・永続化削除・ストア初期化を行う', async () => {
    await run();

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
