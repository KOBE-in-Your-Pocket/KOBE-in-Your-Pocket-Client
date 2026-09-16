import { getApiBaseUrl } from '@/shared/config';

import { AuthApiError } from '../../domain/auth-api-error';
import type { AuthSession, EmailSignUpResult } from '../../domain/auth-session';

/** backend 全 API 共通のエラーレスポンス形式（400 系）。 */
type ApiErrorBody = {
  status?: number;
  error?: string;
  message?: string;
  violations?: unknown[];
};

export { AuthApiError };

/** /auth/signup, /auth/login, /auth/google, /auth/refresh が返すセッションレスポンス。 */
type SessionResponseBody = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    name: string;
    /** 初回ログイン直後などアイコン未設定時は null。 */
    iconUrl: string | null;
  };
};

export type AuthApiOptions = {
  /** 省略時は EXPO_PUBLIC_API_BASE_URL（{@link getApiBaseUrl}）を使う。 */
  baseUrl?: string;
  signal?: AbortSignal;
};

function resolveBaseUrl(baseUrl: string | undefined): string {
  const resolved = baseUrl ?? getApiBaseUrl();
  if (!resolved) {
    throw new Error(
      'backend の API ベース URL が未設定です。EXPO_PUBLIC_API_BASE_URL を .env に設定してください（.env.example 参照）。',
    );
  }

  return resolved;
}

async function postJson(
  url: string,
  { body, accessToken, signal }: { body?: unknown; accessToken?: string; signal?: AbortSignal },
): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal,
  });

  if (!response.ok) {
    let message = `認証 API がエラーを返しました (HTTP ${response.status})`;
    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // エラーレスポンスが JSON でない場合は既定メッセージのまま。
    }
    throw new AuthApiError(response.status, message);
  }

  return response;
}

function parseSessionResponseBody(json: unknown): SessionResponseBody {
  if (!json || typeof json !== 'object') {
    throw new AuthApiError(502, '認証 API のレスポンス形式が不正です');
  }

  const body = json as Record<string, unknown>;
  const user = body.user;

  if (typeof body.accessToken !== 'string' || !body.accessToken) {
    throw new AuthApiError(502, '認証 API のレスポンスに accessToken がありません');
  }
  if (typeof body.refreshToken !== 'string' || !body.refreshToken) {
    throw new AuthApiError(502, '認証 API のレスポンスに refreshToken がありません');
  }
  if (typeof body.expiresIn !== 'number' || !Number.isFinite(body.expiresIn)) {
    throw new AuthApiError(502, '認証 API のレスポンスに expiresIn がありません');
  }
  if (typeof body.tokenType !== 'string' || !body.tokenType) {
    throw new AuthApiError(502, '認証 API のレスポンスに tokenType がありません');
  }
  if (!user || typeof user !== 'object') {
    throw new AuthApiError(502, '認証 API のレスポンスに user がありません');
  }

  const userBody = user as Record<string, unknown>;
  if (typeof userBody.id !== 'string' || !userBody.id) {
    throw new AuthApiError(502, '認証 API のレスポンスに user.id がありません');
  }
  if (typeof userBody.name !== 'string') {
    throw new AuthApiError(502, '認証 API のレスポンスに user.name がありません');
  }
  if (userBody.iconUrl !== null && typeof userBody.iconUrl !== 'string') {
    throw new AuthApiError(502, '認証 API のレスポンスに user.iconUrl がありません');
  }

  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    expiresIn: body.expiresIn,
    tokenType: body.tokenType,
    user: {
      id: userBody.id,
      name: userBody.name,
      iconUrl: userBody.iconUrl as string | null,
    },
  };
}

async function parseSessionResponse(response: Response): Promise<AuthSession> {
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AuthApiError(502, '認証 API のレスポンスを解析できませんでした');
  }

  return toAuthSession(parseSessionResponseBody(json));
}

/** iconUrl が null の場合は空文字に寄せる（PublicUser の iconUrl は string のため）。 */
function toAuthSession(body: SessionResponseBody): AuthSession {
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    expiresIn: body.expiresIn,
    tokenType: body.tokenType,
    user: {
      id: body.user.id,
      name: body.user.name,
      iconUrl: body.user.iconUrl ?? '',
    },
  };
}

/**
 * Google 発行の ID トークンで backend にサインインする。
 * 初回は backend 側でユーザーが自動作成されるため signup / login の区別はない。
 */
export async function signInWithGoogle(
  idToken: string,
  options: AuthApiOptions = {},
): Promise<AuthSession> {
  const response = await postJson(`${resolveBaseUrl(options.baseUrl)}/api/v1/auth/google`, {
    body: { idToken },
    signal: options.signal,
  });

  return parseSessionResponse(response);
}

/**
 * メールアドレスとパスワードで新規登録する（POST /auth/signup、201 を返す）。
 * password は backend 側で 6〜128 文字のバリデーションがかかる。
 *
 * backend 側でメール確認が有効な場合、登録成功でもトークンが null で返るため、
 * その場合はセッションではなく confirmationRequired を返す。
 */
export async function signUpWithEmail(
  params: { email: string; password: string; name: string },
  options: AuthApiOptions = {},
): Promise<EmailSignUpResult> {
  const response = await postJson(`${resolveBaseUrl(options.baseUrl)}/api/v1/auth/signup`, {
    body: params,
    signal: options.signal,
  });

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AuthApiError(502, '認証 API のレスポンスを解析できませんでした');
  }

  if (json && typeof json === 'object' && (json as Record<string, unknown>).accessToken == null) {
    return { status: 'confirmationRequired' };
  }

  return { status: 'session', session: toAuthSession(parseSessionResponseBody(json)) };
}

/** メールアドレスとパスワードでサインインする（POST /auth/login）。 */
export async function signInWithEmail(
  params: { email: string; password: string },
  options: AuthApiOptions = {},
): Promise<AuthSession> {
  const response = await postJson(`${resolveBaseUrl(options.baseUrl)}/api/v1/auth/login`, {
    body: params,
    signal: options.signal,
  });

  return parseSessionResponse(response);
}

/**
 * リフレッシュトークンでセッションを再発行する。
 * リフレッシュトークンはローテーションされるため、返却されたセッションを保存し直すこと。
 */
export async function refreshAuthSession(
  refreshToken: string,
  options: AuthApiOptions = {},
): Promise<AuthSession> {
  const response = await postJson(`${resolveBaseUrl(options.baseUrl)}/api/v1/auth/refresh`, {
    body: { refreshToken },
    signal: options.signal,
  });

  return parseSessionResponse(response);
}

/** backend 側のセッションを破棄する（204 を返す）。 */
export async function logoutAuthSession(
  accessToken: string,
  options: AuthApiOptions = {},
): Promise<void> {
  await postJson(`${resolveBaseUrl(options.baseUrl)}/api/v1/auth/logout`, {
    accessToken,
    signal: options.signal,
  });
}
