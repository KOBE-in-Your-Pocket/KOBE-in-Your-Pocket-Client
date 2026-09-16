import type { PublicUser } from './public-user';

/**
 * backend 認証 API（/auth/google, /auth/refresh）が発行するセッション。
 * accessToken は各 API の Authorization: Bearer ヘッダーに使う。
 */
export type AuthSession = {
  /** backend API へのアクセストークン（短命）。 */
  accessToken: string;
  /** アクセストークン再発行用のリフレッシュトークン。 */
  refreshToken: string;
  /** accessToken の有効期間（秒）。 */
  expiresIn: number;
  /** トークン種別（"bearer"）。 */
  tokenType: string;
  /** ログインしたユーザー。 */
  user: PublicUser;
};

/** secure-store に保存するセッションの部分集合。 */
export type PersistedSession = {
  refreshToken: string;
  user: PublicUser;
};

/**
 * メール新規登録の結果。
 * backend（Supabase）側でメール確認が有効な場合、登録は成功してもセッションは発行されず、
 * ユーザーは確認メールのリンクを開いてからログインする必要がある。
 */
export type EmailSignUpResult =
  | { status: 'session'; session: AuthSession }
  | { status: 'confirmationRequired' };
