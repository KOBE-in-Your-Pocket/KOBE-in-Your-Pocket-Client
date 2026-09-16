import type { AuthSession, EmailSignUpResult, PersistedSession } from './auth-session';
import type { PublicUser } from './public-user';

/** backend 認証 API へのアクセスを抽象化するポート。 */
export type AuthGateway = {
  signInWithGoogle(idToken: string): Promise<AuthSession>;
  signUpWithEmail(params: {
    email: string;
    password: string;
    name: string;
  }): Promise<EmailSignUpResult>;
  signInWithEmail(params: { email: string; password: string }): Promise<AuthSession>;
  refreshAuthSession(refreshToken: string): Promise<AuthSession>;
  logoutAuthSession(accessToken: string): Promise<void>;
};

/** セッションの永続化を抽象化するポート。 */
export type SessionStore = {
  savePersistedSession(session: AuthSession): Promise<void>;
  loadPersistedSession(): Promise<PersistedSession | null>;
  clearPersistedSession(): Promise<void>;
};

/** 永続化済みセッションのユーザー情報のみを更新するポート（アカウント編集用）。 */
export type PersistedUserStore = {
  updatePersistedUser(user: PublicUser): Promise<void>;
};

/** ユーザー情報の取得 API を抽象化するポート。 */
export type UserGateway = {
  fetchCurrentUser(): Promise<PublicUser>;
};
