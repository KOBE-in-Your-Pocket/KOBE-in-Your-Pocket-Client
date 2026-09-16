import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useAuthStore } from '../../store/use-auth-store';
import { resetSessionGenerationForTests } from '../session-operation';
import { performSignOut } from '../use-sign-out';

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
