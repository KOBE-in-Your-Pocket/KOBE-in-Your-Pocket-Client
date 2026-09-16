import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';

import type { AuthSession } from '../../domain/auth-session';
import { useAuthStore } from '../../store/use-auth-store';
import { resetSessionGenerationForTests } from '../session-operation';
import { performGoogleSignIn } from '../use-google-sign-in';

const SESSION: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
};

describe('performGoogleSignIn', () => {
  const signInWithGoogle = jest.fn();
  const savePersistedSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'ios-client.apps.googleusercontent.com';
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });
    (GoogleSignin.hasPlayServices as jest.Mock).mockResolvedValue(true);
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      type: 'success',
      data: { idToken: 'google-id-token' },
    });
    signInWithGoogle.mockResolvedValue(SESSION);
    savePersistedSession.mockResolvedValue(undefined);
  });

  it('サインイン成功時に backend 認証・永続化・ストア更新を行う', async () => {
    const result = await performGoogleSignIn({
      authGateway: {
        signInWithGoogle,
        signUpWithEmail: jest.fn(),
        signInWithEmail: jest.fn(),
        refreshAuthSession: jest.fn(),
        logoutAuthSession: jest.fn(),
      },
      sessionStore: {
        savePersistedSession,
        loadPersistedSession: jest.fn(),
        clearPersistedSession: jest.fn(),
      },
    });

    expect(signInWithGoogle).toHaveBeenCalledWith('google-id-token');
    expect(savePersistedSession).toHaveBeenCalledWith(SESSION);
    expect(useAuthStore.getState().currentUser).toEqual(SESSION.user);
    expect(result).toEqual(SESSION);
  });

  it('サインインキャンセル時は null を返し、backend を呼ばない', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ type: 'cancelled' });

    const result = await performGoogleSignIn({
      authGateway: {
        signInWithGoogle,
        signUpWithEmail: jest.fn(),
        signInWithEmail: jest.fn(),
        refreshAuthSession: jest.fn(),
        logoutAuthSession: jest.fn(),
      },
      sessionStore: {
        savePersistedSession,
        loadPersistedSession: jest.fn(),
        clearPersistedSession: jest.fn(),
      },
    });

    expect(result).toBeNull();
    expect(signInWithGoogle).not.toHaveBeenCalled();
    expect(savePersistedSession).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('ID トークン欠落時はエラーを投げる', async () => {
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
      type: 'success',
      data: { idToken: null },
    });

    await expect(
      performGoogleSignIn({
        authGateway: {
          signInWithGoogle,
          signUpWithEmail: jest.fn(),
          signInWithEmail: jest.fn(),
          refreshAuthSession: jest.fn(),
          logoutAuthSession: jest.fn(),
        },
        sessionStore: {
          savePersistedSession,
          loadPersistedSession: jest.fn(),
          clearPersistedSession: jest.fn(),
        },
      }),
    ).rejects.toThrow(/ID トークン/);
  });

  it('永続化失敗時はストアを更新しない', async () => {
    savePersistedSession.mockRejectedValue(new Error('secure-store failed'));

    await expect(
      performGoogleSignIn({
        authGateway: {
          signInWithGoogle,
          signUpWithEmail: jest.fn(),
          signInWithEmail: jest.fn(),
          refreshAuthSession: jest.fn(),
          logoutAuthSession: jest.fn(),
        },
        sessionStore: {
          savePersistedSession,
          loadPersistedSession: jest.fn(),
          clearPersistedSession: jest.fn(),
        },
      }),
    ).rejects.toThrow('secure-store failed');

    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('isSuccessResponse は成功応答のみ true', () => {
    expect(isSuccessResponse({ type: 'success', data: { idToken: 'token' } } as never)).toBe(true);
    expect(isSuccessResponse({ type: 'cancelled', data: null } as never)).toBe(false);
  });
});
