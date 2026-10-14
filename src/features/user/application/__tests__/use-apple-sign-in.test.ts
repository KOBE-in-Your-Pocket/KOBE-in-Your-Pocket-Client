import * as AppleAuthentication from 'expo-apple-authentication';

import type { AuthGateway, PendingAppleName, PendingAppleNameStore } from '../../domain/auth-ports';
import type { AuthSession } from '../../domain/auth-session';
import { useAuthStore } from '../../store/use-auth-store';
import { bumpSessionGeneration, resetSessionGenerationForTests } from '../session-operation';
import { performAppleSignIn } from '../use-apple-sign-in';

const SESSION: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: '山田 太郎', iconUrl: '' },
};

/** jest.setup.js の expo-crypto モックが返す値（0xab × 32 バイトの hex）。 */
const RAW_NONCE = 'ab'.repeat(32);

function credential(
  overrides: Partial<AppleAuthentication.AppleAuthenticationCredential> = {},
): AppleAuthentication.AppleAuthenticationCredential {
  return {
    user: 'apple-user-1',
    state: null,
    fullName: null,
    email: null,
    realUserStatus: 1,
    identityToken: 'apple-id-token',
    authorizationCode: 'auth-code',
    ...overrides,
  } as AppleAuthentication.AppleAuthenticationCredential;
}

/** メモリ上で動く一時保存ストア。 */
function createPendingNameStore(initial: PendingAppleName | null = null) {
  let value = initial;
  const store: PendingAppleNameStore & { current: () => PendingAppleName | null } = {
    savePendingAppleName: jest.fn(async (pending: PendingAppleName) => {
      value = pending;
    }),
    loadPendingAppleName: jest.fn(async () => value),
    clearPendingAppleName: jest.fn(async () => {
      value = null;
    }),
    current: () => value,
  };
  return store;
}

describe('performAppleSignIn', () => {
  const signInWithApple = jest.fn();
  const savePersistedSession = jest.fn();
  let pendingNameStore: ReturnType<typeof createPendingNameStore>;

  const deps = () => ({
    authGateway: {
      signInWithGoogle: jest.fn(),
      signInWithApple,
      signUpWithEmail: jest.fn(),
      signInWithEmail: jest.fn(),
      refreshAuthSession: jest.fn(),
      logoutAuthSession: jest.fn(),
    } satisfies AuthGateway,
    sessionStore: {
      savePersistedSession,
      loadPersistedSession: jest.fn(),
      clearPersistedSession: jest.fn(),
    },
    pendingNameStore,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });
    pendingNameStore = createPendingNameStore();
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(credential());
    signInWithApple.mockResolvedValue(SESSION);
    savePersistedSession.mockResolvedValue(undefined);
  });

  it('サインイン成功時に backend 認証・永続化・ストア更新を行う', async () => {
    const result = await performAppleSignIn(deps());

    expect(signInWithApple).toHaveBeenCalledWith({
      idToken: 'apple-id-token',
      nonce: RAW_NONCE,
      name: undefined,
    });
    expect(savePersistedSession).toHaveBeenCalledWith(SESSION);
    expect(useAuthStore.getState().currentUser).toEqual(SESSION.user);
    expect(result).toEqual(SESSION);
  });

  it('Apple には nonce の SHA-256 ハッシュを、backend には元の nonce を渡す', async () => {
    await performAppleSignIn(deps());

    expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith(
      expect.objectContaining({ nonce: `sha256(${RAW_NONCE})` }),
    );
    expect(signInWithApple).toHaveBeenCalledWith(expect.objectContaining({ nonce: RAW_NONCE }));
  });

  it('キャンセル時は null を返し、backend を呼ばない', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue(
      Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELED' }),
    );

    const result = await performAppleSignIn(deps());

    expect(result).toBeNull();
    expect(signInWithApple).not.toHaveBeenCalled();
    expect(savePersistedSession).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('キャンセル以外のエラーはそのまま投げる', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue(
      Object.assign(new Error('failed'), { code: 'ERR_REQUEST_FAILED' }),
    );

    await expect(performAppleSignIn(deps())).rejects.toThrow('failed');
    expect(signInWithApple).not.toHaveBeenCalled();
  });

  it('identityToken 欠落時はエラーを投げる', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(
      credential({ identityToken: null }),
    );

    await expect(performAppleSignIn(deps())).rejects.toThrow(/identityToken/);
    expect(signInWithApple).not.toHaveBeenCalled();
  });

  it('初回に返った氏名を name として backend へ渡し、成功後に一時保存を消す', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(
      credential({
        fullName: { familyName: '山田', givenName: '太郎' } as never,
      }),
    );

    await performAppleSignIn(deps());

    expect(signInWithApple).toHaveBeenCalledWith(expect.objectContaining({ name: '山田 太郎' }));
    expect(pendingNameStore.savePendingAppleName).toHaveBeenCalledWith({
      appleUserId: 'apple-user-1',
      name: '山田 太郎',
    });
    expect(pendingNameStore.current()).toBeNull();
  });

  it('backend 失敗時は氏名を保持し、氏名が返らない再試行で再送する', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce(
      credential({ fullName: { familyName: '山田', givenName: '太郎' } as never }),
    );
    signInWithApple.mockRejectedValueOnce(new Error('network'));

    await expect(performAppleSignIn(deps())).rejects.toThrow('network');
    expect(pendingNameStore.current()).toEqual({ appleUserId: 'apple-user-1', name: '山田 太郎' });

    // 2 回目以降、Apple は fullName を返さない。
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce(credential());

    await performAppleSignIn(deps());

    expect(signInWithApple).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '山田 太郎' }),
    );
    expect(pendingNameStore.current()).toBeNull();
  });

  it('保存済みの氏名が別の Apple ID のものなら送らない', async () => {
    pendingNameStore = createPendingNameStore({ appleUserId: 'other-user', name: '別 人' });

    await performAppleSignIn(deps());

    expect(signInWithApple).toHaveBeenCalledWith(expect.objectContaining({ name: undefined }));
  });

  it('一時保存の書き込みに失敗してもサインインは続行する', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue(
      credential({ fullName: { familyName: '山田', givenName: '太郎' } as never }),
    );
    (pendingNameStore.savePendingAppleName as jest.Mock).mockRejectedValue(new Error('keychain'));

    const result = await performAppleSignIn(deps());

    expect(signInWithApple).toHaveBeenCalledWith(expect.objectContaining({ name: '山田 太郎' }));
    expect(result).toEqual(SESSION);
  });

  it('backend 応答待ちの間に別のセッション操作が始まったら古いセッションを反映しない', async () => {
    signInWithApple.mockImplementation(async () => {
      // 例: 待機中にログアウトが走った。
      bumpSessionGeneration();
      return SESSION;
    });

    const result = await performAppleSignIn(deps());

    expect(result).toBeNull();
    expect(savePersistedSession).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('永続化失敗時はストアを更新しない', async () => {
    savePersistedSession.mockRejectedValue(new Error('secure-store failed'));

    await expect(performAppleSignIn(deps())).rejects.toThrow('secure-store failed');
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});
