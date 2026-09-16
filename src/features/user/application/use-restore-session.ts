import { useEffect } from 'react';

import { AuthApiError } from '../domain/auth-api-error';
import type { AuthGateway, SessionStore } from '../domain/auth-ports';
import { defaultAuthGateway, defaultSessionStore } from './auth-deps';
import {
  commitSession,
  enqueueSessionWrite,
  getSessionGeneration,
  isSessionGenerationCurrent,
} from './session-operation';

type RestoreSessionDeps = {
  authGateway: AuthGateway;
  sessionStore: SessionStore;
};

/**
 * secure-store に保存済みのセッションを復元する。
 *
 * 保存済みのリフレッシュトークンを /auth/refresh に渡して有効性を確認し、
 * 成功したら新しいセッションでストアと保存を更新する（トークンはローテーションされる）。
 * backend がエラーを返した場合（失効）は保存分を破棄して未ログインに戻す。
 * ネットワークエラー等では保存分を残し、次回起動時に再試行する。
 */
export async function restoreSession(
  deps: RestoreSessionDeps = {
    authGateway: defaultAuthGateway,
    sessionStore: defaultSessionStore,
  },
): Promise<void> {
  const generation = getSessionGeneration();
  const persisted = await deps.sessionStore.loadPersistedSession();
  if (!persisted || !isSessionGenerationCurrent(generation)) {
    return;
  }

  try {
    const session = await deps.authGateway.refreshAuthSession(persisted.refreshToken);
    await commitSession(session, generation, deps.sessionStore);
  } catch (error) {
    if (!isSessionGenerationCurrent(generation)) {
      return;
    }

    if (error instanceof AuthApiError) {
      await enqueueSessionWrite(async () => {
        if (isSessionGenerationCurrent(generation)) {
          await deps.sessionStore.clearPersistedSession();
        }
      });
    }
  }
}

/** アプリ起動時に一度だけ保存済みセッションの復元を試みるフック。 */
export function useRestoreSession(): void {
  useEffect(() => {
    void restoreSession();
  }, []);
}
