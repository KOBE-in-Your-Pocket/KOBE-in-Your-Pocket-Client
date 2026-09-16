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
