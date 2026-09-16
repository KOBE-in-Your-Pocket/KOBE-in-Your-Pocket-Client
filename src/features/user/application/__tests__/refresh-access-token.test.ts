import { AuthApiError } from '../../domain/auth-api-error';
import { useAuthStore } from '../../store/use-auth-store';
import { refreshAccessToken, resetRefreshAccessTokenForTests } from '../refresh-access-token';
import { bumpSessionGeneration, resetSessionGenerationForTests } from '../session-operation';

import type { AuthGateway, SessionStore } from '../../domain/auth-ports';

const REFRESHED_SESSION = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
};

function createDeps() {
  const authGateway = { refreshAuthSession: jest.fn() } as unknown as AuthGateway;
  const sessionStore = {
    savePersistedSession: jest.fn().mockResolvedValue(undefined),
    loadPersistedSession: jest.fn(),
    clearPersistedSession: jest.fn().mockResolvedValue(undefined),
  } as unknown as SessionStore;

  return { authGateway, sessionStore };
}

describe('refreshAccessToken', () => {
  let deps: ReturnType<typeof createDeps>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    resetRefreshAccessTokenForTests();
    deps = createDeps();
    useAuthStore.setState({
      currentUser: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
      accessToken: 'old-access-token',
      refreshToken: 'stored-refresh-token',
    });
  });

  it('リフレッシュトークンが無ければ再発行せず null を返す', async () => {
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });

    await expect(refreshAccessToken(deps)).resolves.toBeNull();
    expect(deps.authGateway.refreshAuthSession).not.toHaveBeenCalled();
  });

  it('再発行に成功したら新しいセッションを保存・反映して accessToken を返す', async () => {
    (deps.authGateway.refreshAuthSession as jest.Mock).mockResolvedValue(REFRESHED_SESSION);

    await expect(refreshAccessToken(deps)).resolves.toBe('new-access-token');

    expect(deps.authGateway.refreshAuthSession).toHaveBeenCalledWith('stored-refresh-token');
    expect(deps.sessionStore.savePersistedSession).toHaveBeenCalledWith(REFRESHED_SESSION);
    expect(useAuthStore.getState().accessToken).toBe('new-access-token');
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token');
  });

  it('backend がリフレッシュトークンを拒否したらローカルのセッションを破棄する', async () => {
    (deps.authGateway.refreshAuthSession as jest.Mock).mockRejectedValue(
      new AuthApiError(401, 'リフレッシュトークンが失効しました'),
    );

    await expect(refreshAccessToken(deps)).resolves.toBeNull();

    expect(deps.sessionStore.clearPersistedSession).toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('ネットワークエラーではセッションを残し、次の機会に再試行できるようにする', async () => {
    (deps.authGateway.refreshAuthSession as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(refreshAccessToken(deps)).resolves.toBeNull();

    expect(deps.sessionStore.clearPersistedSession).not.toHaveBeenCalled();
    expect(useAuthStore.getState().refreshToken).toBe('stored-refresh-token');
  });

  it('並行して呼ばれてもリフレッシュは 1 回だけ走る', async () => {
    (deps.authGateway.refreshAuthSession as jest.Mock).mockResolvedValue(REFRESHED_SESSION);

    const [first, second] = await Promise.all([refreshAccessToken(deps), refreshAccessToken(deps)]);

    expect(first).toBe('new-access-token');
    expect(second).toBe('new-access-token');
    expect(deps.authGateway.refreshAuthSession).toHaveBeenCalledTimes(1);
  });

  it('完了後は共有が解除され、次の呼び出しで再度リフレッシュする', async () => {
    (deps.authGateway.refreshAuthSession as jest.Mock).mockResolvedValue(REFRESHED_SESSION);

    await refreshAccessToken(deps);
    await refreshAccessToken(deps);

    expect(deps.authGateway.refreshAuthSession).toHaveBeenCalledTimes(2);
  });

  it('リフレッシュ中にログアウトされたらセッションを書き戻さない', async () => {
    (deps.authGateway.refreshAuthSession as jest.Mock).mockImplementation(async () => {
      bumpSessionGeneration();
      return REFRESHED_SESSION;
    });

    await expect(refreshAccessToken(deps)).resolves.toBeNull();

    expect(deps.sessionStore.savePersistedSession).not.toHaveBeenCalled();
  });
});
