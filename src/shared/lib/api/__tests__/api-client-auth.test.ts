import { apiFetch } from '../api-client';
import { ApiError } from '../api-error';
import { setAuthTokenProvider, type AuthTokenProvider } from '../auth-token-provider';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function providerOf(overrides: Partial<AuthTokenProvider> = {}): AuthTokenProvider {
  return {
    getAccessToken: () => 'access-token',
    refreshAccessToken: async () => null,
    ...overrides,
  };
}

function headersOfCall(index: number): Record<string, string> {
  return mockFetch.mock.calls[index][1].headers as Record<string, string>;
}

describe('apiFetch（認証付き）', () => {
  const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:9090';
    setAuthTokenProvider(null);
  });

  afterAll(() => {
    setAuthTokenProvider(null);
    if (originalBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalBaseUrl;
    }
  });

  it('auth: true のときアクセストークンを Authorization ヘッダーで送る', async () => {
    setAuthTokenProvider(providerOf());
    mockFetch.mockResolvedValue(jsonResponse(200, { id: 'review-1' }));

    await apiFetch('/api/v1/tourism/spots/nankinmachi/reviews', {
      method: 'POST',
      body: { rating: 5 },
      auth: true,
    });

    expect(headersOfCall(0).Authorization).toBe('Bearer access-token');
  });

  it('auth を指定しなければ Authorization ヘッダーを送らない', async () => {
    setAuthTokenProvider(providerOf());
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    await apiFetch('/api/v1/tourism/spots');

    expect(headersOfCall(0)).not.toHaveProperty('Authorization');
  });

  it('provider 未注入なら auth: true でも Authorization を送らずそのまま実行する', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));

    await apiFetch('/api/v1/users/me', { auth: true });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(headersOfCall(0)).not.toHaveProperty('Authorization');
  });

  it('401 ならトークンを再発行し、新しいトークンで 1 回だけ再試行する', async () => {
    const refreshAccessToken = jest.fn(async () => 'refreshed-token');
    setAuthTokenProvider(providerOf({ refreshAccessToken }));
    mockFetch
      .mockResolvedValueOnce(jsonResponse(401, { error: 'UNAUTHORIZED', message: '期限切れ' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 'user-1' }));

    await expect(apiFetch('/api/v1/users/me', { auth: true })).resolves.toEqual({ id: 'user-1' });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(headersOfCall(0).Authorization).toBe('Bearer access-token');
    expect(headersOfCall(1).Authorization).toBe('Bearer refreshed-token');
  });

  it('再発行できなければ再試行せず 401 の ApiError を投げる', async () => {
    const refreshAccessToken = jest.fn(async () => null);
    setAuthTokenProvider(providerOf({ refreshAccessToken }));
    mockFetch.mockResolvedValue(
      jsonResponse(401, { error: 'UNAUTHORIZED', message: 'ログインが必要です' }),
    );

    await expect(apiFetch('/api/v1/users/me', { auth: true })).rejects.toBeInstanceOf(ApiError);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('再試行後も 401 なら再々試行せず ApiError を投げる', async () => {
    setAuthTokenProvider(providerOf({ refreshAccessToken: async () => 'refreshed-token' }));
    mockFetch.mockResolvedValue(
      jsonResponse(401, { error: 'UNAUTHORIZED', message: 'ログインが必要です' }),
    );

    await expect(apiFetch('/api/v1/users/me', { auth: true })).rejects.toMatchObject({
      status: 401,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('401 以外のエラーではトークンを再発行しない', async () => {
    const refreshAccessToken = jest.fn(async () => 'refreshed-token');
    setAuthTokenProvider(providerOf({ refreshAccessToken }));
    mockFetch.mockResolvedValue(jsonResponse(403, { error: 'FORBIDDEN', message: '権限不足' }));

    await expect(apiFetch('/api/v1/users/me', { auth: true })).rejects.toMatchObject({
      status: 403,
    });

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('未ログイン（アクセストークン null）でも 401 後の再発行に成功すれば再試行する', async () => {
    setAuthTokenProvider(
      providerOf({ getAccessToken: () => null, refreshAccessToken: async () => 'refreshed-token' }),
    );
    mockFetch
      .mockResolvedValueOnce(jsonResponse(401, { error: 'UNAUTHORIZED', message: '期限切れ' }))
      .mockResolvedValueOnce(jsonResponse(200, {}));

    await apiFetch('/api/v1/users/me', { auth: true });

    expect(headersOfCall(0)).not.toHaveProperty('Authorization');
    expect(headersOfCall(1).Authorization).toBe('Bearer refreshed-token');
  });
});
