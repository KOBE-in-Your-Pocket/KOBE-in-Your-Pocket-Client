import type {
  AuthGateway,
  PersistedUserStore,
  SessionStore,
  UserGateway,
} from '../domain/auth-ports';
import {
  logoutAuthSession,
  refreshAuthSession,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../infrastructure/api/auth-api';
import { fetchCurrentUser } from '../infrastructure/api/user-api';
import {
  clearPersistedSession,
  loadPersistedSession,
  savePersistedSession,
  updatePersistedUser,
} from '../infrastructure/storage/session-storage';

/** 本番用の認証 API ゲートウェイ。 */
export const defaultAuthGateway: AuthGateway = {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  refreshAuthSession,
  logoutAuthSession,
};

/** 本番用のセッション永続化ストア。 */
export const defaultSessionStore: SessionStore = {
  savePersistedSession,
  loadPersistedSession,
  clearPersistedSession,
};

/** 本番用の永続化ユーザー更新ストア。 */
export const defaultPersistedUserStore: PersistedUserStore = {
  updatePersistedUser,
};

/** 本番用のユーザー取得ゲートウェイ。 */
export const defaultUserGateway: UserGateway = {
  fetchCurrentUser,
};
