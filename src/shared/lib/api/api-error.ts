/** バックエンド統一エラーレスポンスの field 単位のバリデーション違反。 */
export interface ApiFieldViolation {
  field: string;
  message: string;
}

/** バックエンドの統一エラーレスポンス形式（ApiErrorResponse.kt に対応）。 */
export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  violations?: ApiFieldViolation[];
}

/** API 呼び出しの失敗（非 2xx レスポンス）を表すエラー。 */
export class ApiError extends Error {
  readonly status: number;
  readonly error: string;
  readonly violations: ApiFieldViolation[];

  constructor(
    status: number,
    error: string,
    message: string,
    violations: ApiFieldViolation[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
    this.violations = violations;
  }

  /**
   * レスポンスボディから ApiError を組み立てる。
   * ボディが統一エラー形式でない場合も HTTP ステータスだけで安全に組み立てる。
   */
  static fromResponse(status: number, body: unknown): ApiError {
    if (isApiErrorResponse(body)) {
      return new ApiError(status, body.error, body.message, body.violations ?? []);
    }

    return new ApiError(status, 'UNKNOWN', `API リクエストが失敗しました（HTTP ${status}）`);
  }
}

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.error === 'string' &&
    typeof candidate.message === 'string' &&
    (candidate.violations === undefined || Array.isArray(candidate.violations))
  );
}
