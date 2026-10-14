import type { AuthSession, EmailSignUpResult, PersistedSession } from './auth-session';
import type { ProfileUpdateRequest } from './profile-edits';
import type { PublicUser } from './public-user';

/** backend の Apple サインイン（POST /auth/apple）へ渡す値。 */
export type AppleSignInParams = {
  /** Apple が発行した ID トークン（identityToken）。 */
  idToken: string;
  /** signInAsync へ SHA-256 ハッシュを渡した元の nonce。GoTrue がトークン内の値と照合する。 */
  nonce: string;
  /** Apple が初回認証時のみ返す表示名。backend はプロフィール新規作成時のみ使う。 */
  name?: string;
};

/** backend 認証 API へのアクセスを抽象化するポート。 */
export type AuthGateway = {
  signInWithGoogle(idToken: string): Promise<AuthSession>;
  signInWithApple(params: AppleSignInParams): Promise<AuthSession>;
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

/** ユーザー情報の取得・更新・削除 API を抽象化するポート。 */
export type UserGateway = {
  fetchCurrentUser(): Promise<PublicUser>;
  updateCurrentUser(request: ProfileUpdateRequest): Promise<PublicUser>;
  uploadMyIcon(localUri: string): Promise<PublicUser>;
  deleteCurrentUser(): Promise<void>;
};

/** Apple が初回のみ返す表示名（backend へ渡せるまで保持するもの）。 */
export type PendingAppleName = {
  /** Apple のユーザー識別子（credential.user）。別の Apple ID へ名前を送らないために使う。 */
  appleUserId: string;
  name: string;
};

/**
 * Apple の表示名を backend の成功まで保持するポート。
 * Apple は 2 回目以降 fullName を返さないため、backend 呼び出しが失敗しても再送できるようにする。
 */
export type PendingAppleNameStore = {
  savePendingAppleName(pending: PendingAppleName): Promise<void>;
  loadPendingAppleName(): Promise<PendingAppleName | null>;
  clearPendingAppleName(): Promise<void>;
};
