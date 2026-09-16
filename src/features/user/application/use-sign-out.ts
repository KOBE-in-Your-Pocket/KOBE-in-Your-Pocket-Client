import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';

import type { AuthGateway, SessionStore } from '../domain/auth-ports';
import { useAuthStore } from '../store/use-auth-store';
import { defaultAuthGateway, defaultSessionStore } from './auth-deps';
import { bumpSessionGeneration, enqueueSessionWrite } from './session-operation';

type SignOutDeps = {
  authGateway: AuthGateway;
  sessionStore: SessionStore;
};

/**
 * ログアウトの一連の流れを実行する。
 *
 * backend のセッション破棄と GoogleSignin.signOut() は失敗しても続行し、
 * ローカルのセッション（secure-store とストア）は必ず破棄する。
 */
export async function performSignOut(
  deps: SignOutDeps = {
    authGateway: defaultAuthGateway,
    sessionStore: defaultSessionStore,
  },
): Promise<void> {
  bumpSessionGeneration();

  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    try {
      await deps.authGateway.logoutAuthSession(accessToken);
    } catch {
      // トークン失効・オフラインでもローカルのログアウトは完了させる。
    }
  }

  try {
    await GoogleSignin.signOut();
  } catch {
    // 未 configure などで失敗してもローカルのログアウトは完了させる。
  }

  try {
    // 進行中のサインイン書き込みと交錯して古いセッションが残らないよう直列化する。
    await enqueueSessionWrite(() => deps.sessionStore.clearPersistedSession());
  } finally {
    useAuthStore.getState().logout();
  }
}

/** ログアウトを実行する mutation。 */
export function useSignOut() {
  return useMutation({ mutationFn: () => performSignOut() });
}
