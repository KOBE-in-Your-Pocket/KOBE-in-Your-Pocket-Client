/** backend がエラーレスポンス（4xx/5xx）を返したことを表すエラー。 */
export class AuthApiError extends Error {
  /** HTTP ステータスコード。 */
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

/** リフレッシュトークンが無効と判断する HTTP ステータス（期限切れ・失効・ローテーション済みなど）。 */
const INVALID_REFRESH_TOKEN_STATUSES: ReadonlySet<number> = new Set([400, 401]);

/**
 * backend がリフレッシュトークンを無効として拒否したか（400 / 401）。
 *
 * true のときは再試行しても成功しないため、セッションを破棄してよい。
 * 5xx や解析エラー（502）、ネットワークエラーはサーバー側の一時的な不調でありうるので false。
 */
export function isInvalidRefreshTokenError(error: unknown): error is AuthApiError {
  return error instanceof AuthApiError && INVALID_REFRESH_TOKEN_STATUSES.has(error.status);
}
