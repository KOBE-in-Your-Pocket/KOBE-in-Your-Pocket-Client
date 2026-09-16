import { useAuthStore } from '../../store/use-auth-store';
import { createAuthTokenProvider } from '../auth-token-provider';
import { refreshAccessToken } from '../refresh-access-token';

jest.mock('../refresh-access-token', () => ({
  refreshAccessToken: jest.fn(),
}));

const refreshMock = refreshAccessToken as jest.Mock;

describe('createAuthTokenProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });
  });

  it('認証ストアの最新のアクセストークンを返す', () => {
    const provider = createAuthTokenProvider();

    expect(provider.getAccessToken()).toBeNull();

    useAuthStore.setState({ accessToken: 'access-token' });

    expect(provider.getAccessToken()).toBe('access-token');
  });

  it('refreshAccessToken に委譲する', async () => {
    refreshMock.mockResolvedValue('new-access-token');
    const provider = createAuthTokenProvider();

    await expect(provider.refreshAccessToken()).resolves.toBe('new-access-token');
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
