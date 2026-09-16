import { create } from 'zustand';

import type { AuthSession } from '../domain/auth-session';
import type { PublicUser } from '../domain/public-user';

type AuthState = {
  /** ログイン中のユーザー。未ログイン時は null。 */
  currentUser: PublicUser | null;
  /** backend API の Bearer トークン。未ログイン・モックログイン時は null。 */
  accessToken: string | null;
  /** アクセストークン再発行用のリフレッシュトークン。未ログイン・モックログイン時は null。 */
  refreshToken: string | null;
  /** ユーザーのみ設定するモック用ログイン（トークンは設定しない）。既存呼び出し元との互換用。 */
  login: (user: PublicUser) => void;
  /** backend 認証で得たセッション（ユーザー + トークン）を設定する。 */
  setSession: (session: AuthSession) => void;
  /** ログイン状態（トークン）を保ったまま現在ユーザーの情報のみ更新する。 */
  updateCurrentUser: (user: PublicUser) => void;
  /** ログアウトし、ユーザー・トークンをすべて未設定に戻す。 */
  logout: () => void;
};

/**
 * ログイン状態（現在ユーザーとトークン）を保持するストア（#397）。
 *
 * Google サインイン（application 層）が `setSession()` でセッションを設定し、
 * 永続化は infrastructure/storage/session-storage が担う。ストア自体はメモリ保持で、
 * 起動時の復元は application 層の restoreSession() が行う。
 */
export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  accessToken: null,
  refreshToken: null,
  login: (user) => set({ currentUser: user, accessToken: null, refreshToken: null }),
  updateCurrentUser: (user) => set({ currentUser: user }),
  setSession: (session) =>
    set({
      currentUser: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    }),
  logout: () => set({ currentUser: null, accessToken: null, refreshToken: null }),
}));
