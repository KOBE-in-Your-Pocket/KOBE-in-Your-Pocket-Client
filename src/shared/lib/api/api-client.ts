import { getApiBaseUrl } from '@/shared/config';

import { ApiError } from './api-error';
import { getAuthTokenProvider } from './auth-token-provider';

/** apiFetch のオプション。 */
export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON シリアライズして送信するリクエストボディ。 */
  body?: unknown;
  /** クエリパラメータ。undefined の値は除外される。 */
  query?: Record<string, string | number | boolean | undefined>;
  /** Accept-Language ヘッダに設定する言語（例: 'ja', 'en'）。 */
  language?: string;
  /**
   * 認証必須エンドポイント向け。アクセストークンを `Authorization: Bearer` で送り、
   * 401 が返ったらトークンを再発行して 1 回だけ再試行する。
   */
  auth?: boolean;
  /** 呼び出し側からのキャンセル用シグナル。 */
  signal?: AbortSignal;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * バックエンド REST API 共通の fetch クライアント。
 *
 * ベース URL の解決・共通ヘッダ・タイムアウト・統一エラー形式の変換を担う。
 * `auth: true` のときはアクセストークンの付与とリフレッシュ再試行も担う。
 * 非 2xx レスポンスは {@link ApiError} として throw する。
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL が設定されていません。.env を確認してください（.env.example 参照）。',
    );
  }

  const url = buildUrl(baseUrl, path, options.query);
  const body = options.body !== undefined ? JSON.stringify(options.body) : undefined;
  const tokenProvider = options.auth ? getAuthTokenProvider() : null;

  let response = await sendRequest(url, body, options, tokenProvider?.getAccessToken() ?? null);

  // 401 はアクセストークンの期限切れの可能性がある。再発行できたときだけ 1 回再試行する
  // （再発行に失敗した場合はそのまま 401 を ApiError として呼び出し側へ返す）。
  if (response.status === 401 && tokenProvider) {
    const refreshedToken = await tokenProvider.refreshAccessToken();
    if (refreshedToken) {
      response = await sendRequest(url, body, options, refreshedToken);
    }
  }

  if (!response.ok) {
    throw ApiError.fromResponse(response.status, await parseJsonSafely(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * 1 回分のリクエストを送る。タイムアウト用の AbortController は試行ごとに作り直す
 * （初回のタイムアウトで再試行まで巻き込んで中断されるのを防ぐ）。
 */
async function sendRequest(
  url: string,
  body: string | undefined,
  options: ApiFetchOptions,
  accessToken: string | null,
): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.language) {
    headers['Accept-Language'] = options.language;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (options.signal?.aborted) {
    controller.abort();
  }
  options.signal?.addEventListener('abort', abortFromCaller);

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new Error(`API リクエストがタイムアウトしました: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}${buildQueryString(query)}`;
}

function buildQueryString(query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) {
    return '';
  }

  const pairs = Object.entries(query)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
