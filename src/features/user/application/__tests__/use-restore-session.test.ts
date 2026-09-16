import { AuthApiError, refreshAuthSession } from '../../infrastructure/api/auth-api';
import {
  clearPersistedSession,
  loadPersistedSession,
  savePersistedSession,
} from '../../infrastructure/storage/session-storage';
import { useAuthStore } from '../../store/use-auth-store';
import { bumpSessionGeneration, resetSessionGenerationForTests } from '../session-operation';
import { restoreSession } from '../use-restore-session';

jest.mock('../../infrastructure/api/auth-api', () => {
  const actual = jest.requireActual('../../infrastructure/api/auth-api');
  return { ...actual, refreshAuthSession: jest.fn() };
});

jest.mock('../../infrastructure/storage/session-storage', () => ({
  loadPersistedSession: jest.fn(),
  savePersistedSession: jest.fn(),
  clearPersistedSession: jest.fn(),
}));

const refreshMock = refreshAuthSession as jest.Mock;
const loadMock = loadPersistedSession as jest.Mock;
const saveMock = savePersistedSession as jest.Mock;
const clearMock = clearPersistedSession as jest.Mock;

const PERSISTED = {
  refreshToken: 'stored-refresh-token',
  user: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
};

const REFRESHED_SESSION = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
};

describe('restoreSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSessionGenerationForTests();
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });
  });

  it('保存済みセッションがなければ何もしない', async () => {
    loadMock.mockResolvedValue(null);

    await restoreSession();

    expect(refreshMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('リフレッシュに成功したらストアを更新し、ローテーション後のセッションを保存し直す', async () => {
    loadMock.mockResolvedValue(PERSISTED);
    refreshMock.mockResolvedValue(REFRESHED_SESSION);

    await restoreSession();

    expect(refreshMock).toHaveBeenCalledWith('stored-refresh-token');
    const state = useAuthStore.getState();
    expect(state.currentUser).toEqual(REFRESHED_SESSION.user);
    expect(state.accessToken).toBe('new-access-token');
    expect(saveMock).toHaveBeenCalledWith(REFRESHED_SESSION);
  });

  it('backend がエラーを返した場合（失効）は保存済みセッションを破棄する', async () => {
    loadMock.mockResolvedValue(PERSISTED);
    refreshMock.mockRejectedValue(new AuthApiError(401, 'expired'));

    await restoreSession();

    expect(clearMock).toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('ネットワークエラー等では保存済みセッションを残す（次回起動時に再試行）', async () => {
    loadMock.mockResolvedValue(PERSISTED);
    refreshMock.mockRejectedValue(new TypeError('Network request failed'));

    await restoreSession();

    expect(clearMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });

  it('リフレッシュ待機中にログアウトされた場合、古いセッションを復元しない', async () => {
    loadMock.mockResolvedValue(PERSISTED);
    let resolveRefresh: (value: typeof REFRESHED_SESSION) => void = () => {};
    refreshMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const restorePromise = restoreSession();
    bumpSessionGeneration();
    resolveRefresh(REFRESHED_SESSION);
    await restorePromise;

    expect(saveMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});
