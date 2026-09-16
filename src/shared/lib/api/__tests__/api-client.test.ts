import { apiFetch } from '../api-client';
import { ApiError } from '../api-error';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('apiFetch', () => {
  const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:9090';
  });

  afterAll(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalBaseUrl;
    }
  });

  it('ベース URL とパスから URL を組み立てて GET する', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, [{ id: 'spot-1' }]));

    await expect(apiFetch('/api/v1/tourism/spots')).resolves.toEqual([{ id: 'spot-1' }]);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://10.0.2.2:9090/api/v1/tourism/spots',
      expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } }),
    );
  });

  it('ベース URL 末尾スラッシュとパス先頭スラッシュ欠落を正規化する', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:9090/';
    mockFetch.mockResolvedValue(jsonResponse(200, {}));

    await apiFetch('api/v1/manner/items');

    expect(mockFetch.mock.calls[0][0]).toBe('http://10.0.2.2:9090/api/v1/manner/items');
  });

  it('query の undefined を除外し、値を URL エンコードする', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));

    await apiFetch('/api/v1/tourism/spots', {
      query: { lang: 'ja', keyword: '北野 異人館', page: undefined },
    });

    expect(mockFetch.mock.calls[0][0]).toBe(
      'http://10.0.2.2:9090/api/v1/tourism/spots?lang=ja&keyword=%E5%8C%97%E9%87%8E%20%E7%95%B0%E4%BA%BA%E9%A4%A8',
    );
  });

  it('language 指定時は Accept-Language ヘッダを付与する', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));

    await apiFetch('/api/v1/tourism/spots', { language: 'en' });

    expect(mockFetch.mock.calls[0][1].headers).toEqual({
      Accept: 'application/json',
      'Accept-Language': 'en',
    });
  });

  it('body 指定時は JSON シリアライズして Content-Type を付与する', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { id: 'review-1' }));

    await apiFetch('/api/v1/tourism/reviews', {
      method: 'POST',
      body: { rating: 5 },
    });

    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ rating: 5 }),
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    });
  });

  it('204 レスポンスは undefined を返す', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('no body');
      },
    } as unknown as Response);

    await expect(
      apiFetch('/api/v1/tourism/reviews/1', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('非 2xx はボディを ApiError に変換して throw する', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(404, {
        status: 404,
        error: 'Not Found',
        message: 'Spot not found: missing',
      }),
    );

    const promise = apiFetch('/api/v1/tourism/spots/missing');

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      error: 'Not Found',
      message: 'Spot not found: missing',
    });
  });

  it('エラーボディが JSON でなくても ApiError を throw する', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    await expect(apiFetch('/api/v1/health')).rejects.toMatchObject({
      status: 502,
      error: 'UNKNOWN',
    });
  });

  it('ネットワークエラーはそのまま伝播する', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiFetch('/api/v1/tourism/spots')).rejects.toThrow('Network request failed');
  });

  it('タイムアウト時は専用メッセージのエラーを throw する', async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    const promise = apiFetch('/api/v1/tourism/spots', { timeoutMs: 100 });
    const assertion = expect(promise).rejects.toThrow('タイムアウト');
    jest.advanceTimersByTime(101);

    await assertion;
    jest.useRealTimers();
  });

  it('ベース URL 未設定時は fetch せずにエラーを throw する', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    await expect(apiFetch('/api/v1/tourism/spots')).rejects.toThrow('EXPO_PUBLIC_API_BASE_URL');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
