import * as AppleAuthentication from 'expo-apple-authentication';

import type { AuthGateway, SessionStore } from '../../domain/auth-ports';
import type { AuthSession } from '../../domain/auth-session';
import { useAuthStore } from '../../store/use-auth-store';
import { resetSessionGenerationForTests } from '../session-operation';
import { performAppleSignIn } from '../use-apple-sign-in';

const SESSION: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: 'Apple 太郎', iconUrl: '' },
};

describe('performAppleSignIn', () => {
  const signInWithApple = jest.fn();
  const savePersistedSession = jest.fn();

  const deps = (): { authGateway: AuthGateway; sessionStore: SessionStore } => ({
    authGateway: {
      signInWithGoogle: jest.fn(),
      signInWithApple,
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

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
      identityToken: 'apple-id-token',
    });
    signInWithApple.mockResolvedValue(SESSION);
    savePersistedSession.mockResolvedValue(undefined);
  });

  it('Apple にはハッシュ済み nonce、backend には生の nonce を渡し、セッションを確立する', async () => {
    const result = await performAppleSignIn(deps());

    expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith(
      expect.objectContaining({ nonce: 'hashed:raw-nonce' }),
    );
    expect(signInWithApple).toHaveBeenCalledWith({
      idToken: 'apple-id-token',
      nonce: 'raw-nonce',
    });
    expect(savePersistedSession).toHaveBeenCalledWith(SESSION);
    expect(useAuthStore.getState().currentUser).toEqual(SESSION.user);
    expect(result).toEqual(SESSION);
  });

  it('キャンセル時は null を返し、backend を呼ばない', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue(
      Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELED' }),
    );

    const result = await performAppleSignIn(deps());

    expect(result).toBeNull();
    expect(signInWithApple).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('キャンセル以外の Apple 側エラーはそのまま投げる', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue(
      Object.assign(new Error('failed'), { code: 'ERR_REQUEST_FAILED' }),
    );

    await expect(performAppleSignIn(deps())).rejects.toThrow('failed');
    expect(signInWithApple).not.toHaveBeenCalled();
  });

  it('ID トークン欠落時はエラーを投げる', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({ identityToken: null });

    await expect(performAppleSignIn(deps())).rejects.toThrow(/ID トークン/);
  });
});
