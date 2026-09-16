/**
 * 認証付き API 呼び出しに必要なトークン供給の抽象（seam）。
 *
 * 実装は `features/user` が持つが、`shared` から feature を import すると
 * FSD の依存方向（feature → shared）が逆転する。composition root
 * （`src/app/_layout.tsx`）が {@link setAuthTokenProvider} で実装を注入し、
 * `apiFetch` はこの型だけに依存する。
 */
export type AuthTokenProvider = {
  /** 現在のアクセストークン。未ログイン時は null。 */
  getAccessToken(): string | null;
  /**
   * リフレッシュトークンでアクセストークンを再発行する。
   * 再発行できない（未ログイン・リフレッシュトークン失効）場合は null を返す。
   */
  refreshAccessToken(): Promise<string | null>;
};

let authTokenProvider: AuthTokenProvider | null = null;

/** composition root からトークン供給の実装を注入する。null で解除（テスト用）。 */
export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider;
}

/** 注入済みのトークン供給を取得する。未注入なら null。 */
export function getAuthTokenProvider(): AuthTokenProvider | null {
  return authTokenProvider;
}
