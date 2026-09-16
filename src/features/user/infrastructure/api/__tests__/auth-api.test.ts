import {
  AuthApiError,
  logoutAuthSession,
  refreshAuthSession,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../auth-api';

const BASE_URL = 'https://api.example.com';

const SESSION_BODY = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: 'Google 太郎', iconUrl: null },
};

function mockFetchResponse(status: number, body?: unknown) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: body === undefined ? () => Promise.reject(new Error('no body')) : async () => body,
  });
}

describe('auth-api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('idToken を /api/v1/auth/google に POST し、セッションを返す', async () => {
      const fetchMock = mockFetchResponse(200, SESSION_BODY);
      global.fetch = fetchMock;

      const session = await signInWithGoogle('google-id-token', { baseUrl: BASE_URL });

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/auth/google`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ idToken: 'google-id-token' }),
        }),
      );
      expect(session).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'bearer',
        // backend の iconUrl: null は PublicUser（string）に合わせて空文字へ寄せる
        user: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
      });
    });

    it('エラーレスポンスの message を持つ AuthApiError を投げる', async () => {
      global.fetch = mockFetchResponse(400, {
        status: 400,
        error: 'Bad Request',
        message: 'ID トークンが不正です',
        violations: [],
      });

      const promise = signInWithGoogle('bad-token', { baseUrl: BASE_URL });

      await expect(promise).rejects.toBeInstanceOf(AuthApiError);
      await expect(promise).rejects.toMatchObject({
        status: 400,
        message: 'ID トークンが不正です',
      });
    });

    it('エラーレスポンスが JSON でない場合も HTTP ステータス付きの AuthApiError を投げる', async () => {
      global.fetch = mockFetchResponse(500);

      await expect(signInWithGoogle('token', { baseUrl: BASE_URL })).rejects.toMatchObject({
        name: 'AuthApiError',
        status: 500,
      });
    });

    it('必須フィールド欠落のレスポンスは AuthApiError を投げる', async () => {
      global.fetch = mockFetchResponse(200, { accessToken: 'only-access' });

      await expect(signInWithGoogle('token', { baseUrl: BASE_URL })).rejects.toMatchObject({
        name: 'AuthApiError',
        status: 502,
      });
    });

    it('不正な JSON レスポンスは AuthApiError を投げる', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('invalid json')),
      });

      await expect(signInWithGoogle('token', { baseUrl: BASE_URL })).rejects.toMatchObject({
        name: 'AuthApiError',
        status: 502,
        message: '認証 API のレスポンスを解析できませんでした',
      });
    });
  });

  describe('signUpWithEmail', () => {
    it('email / password / name を /api/v1/auth/signup に POST し、セッションを返す', async () => {
      const fetchMock = mockFetchResponse(201, SESSION_BODY);
      global.fetch = fetchMock;

      const result = await signUpWithEmail(
        { email: 'taro@example.com', password: 'password123', name: 'メール 太郎' },
        { baseUrl: BASE_URL },
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/auth/signup`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'taro@example.com',
            password: 'password123',
            name: 'メール 太郎',
          }),
        }),
      );
      expect(result.status).toBe('session');
      if (result.status === 'session') {
        expect(result.session.accessToken).toBe('access-token');
      }
    });

    it('メール確認が有効でトークンが null の場合は confirmationRequired を返す', async () => {
      global.fetch = mockFetchResponse(201, {
        accessToken: null,
        refreshToken: null,
        expiresIn: null,
        tokenType: null,
        user: { id: 'user-1', name: 'メール 太郎', iconUrl: null },
      });

      const result = await signUpWithEmail(
        { email: 'taro@example.com', password: 'password123', name: 'メール 太郎' },
        { baseUrl: BASE_URL },
      );

      expect(result).toEqual({ status: 'confirmationRequired' });
    });

    it('バリデーションエラー時は AuthApiError を投げる', async () => {
      global.fetch = mockFetchResponse(400, {
        status: 400,
        error: 'Bad Request',
        message: 'password は 6 文字以上にしてください',
        violations: [],
      });

      await expect(
        signUpWithEmail(
          { email: 'taro@example.com', password: 'short', name: 'メール 太郎' },
          { baseUrl: BASE_URL },
        ),
      ).rejects.toMatchObject({
        name: 'AuthApiError',
        status: 400,
        message: 'password は 6 文字以上にしてください',
      });
    });
  });

  describe('signInWithEmail', () => {
    it('email / password を /api/v1/auth/login に POST し、セッションを返す', async () => {
      const fetchMock = mockFetchResponse(200, SESSION_BODY);
      global.fetch = fetchMock;

      const session = await signInWithEmail(
        { email: 'taro@example.com', password: 'password123' },
        { baseUrl: BASE_URL },
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'taro@example.com', password: 'password123' }),
        }),
      );
      expect(session.refreshToken).toBe('refresh-token');
    });

    it('認証情報が誤っている場合は AuthApiError を投げる', async () => {
      global.fetch = mockFetchResponse(400, {
        status: 400,
        error: 'Bad Request',
        message: 'Invalid login credentials',
        violations: [],
      });

      const promise = signInWithEmail(
        { email: 'taro@example.com', password: 'wrong-password' },
        { baseUrl: BASE_URL },
      );

      await expect(promise).rejects.toBeInstanceOf(AuthApiError);
      await expect(promise).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('refreshAuthSession', () => {
    it('refreshToken を /api/v1/auth/refresh に POST し、セッションを返す', async () => {
      const fetchMock = mockFetchResponse(200, {
        ...SESSION_BODY,
        user: { ...SESSION_BODY.user, iconUrl: 'https://example.com/icon.png' },
      });
      global.fetch = fetchMock;

      const session = await refreshAuthSession('refresh-token', { baseUrl: BASE_URL });

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/auth/refresh`,
        expect.objectContaining({ body: JSON.stringify({ refreshToken: 'refresh-token' }) }),
      );
      expect(session.user.iconUrl).toBe('https://example.com/icon.png');
    });
  });

  describe('logoutAuthSession', () => {
    it('Authorization ヘッダー付きで /api/v1/auth/logout に POST する', async () => {
      const fetchMock = mockFetchResponse(204);
      global.fetch = fetchMock;

      await logoutAuthSession('access-token', { baseUrl: BASE_URL });

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/auth/logout`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
        }),
      );
    });
  });
});
