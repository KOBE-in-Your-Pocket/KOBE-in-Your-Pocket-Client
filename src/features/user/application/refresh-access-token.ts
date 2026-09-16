import { AuthApiError } from '../domain/auth-api-error';
import type { AuthGateway, SessionStore } from '../domain/auth-ports';
import { useAuthStore } from '../store/use-auth-store';
import { defaultAuthGateway, defaultSessionStore } from './auth-deps';
import {
  commitSession,
  enqueueSessionWrite,
  getSessionGeneration,
  isSessionGenerationCurrent,
} from './session-operation';

type RefreshAccessTokenDeps = {
  authGateway: AuthGateway;
  sessionStore: SessionStore;
};

let inFlightRefresh: Promise<string | null> | null = null;

/**
 * アクセストークンを再発行する。
 *
 * 401 を受けた複数のリクエストが同時に呼んでもリフレッシュは 1 回だけ走る
 * （リフレッシュトークンはローテーションされるため、並行実行すると
 * 後発のリクエストが失効済みトークンを使って必ず失敗する）。
 *
 * 再発行できない場合は null を返す。リフレッシュトークンが backend に拒否された
 * ときはローカルのセッションも破棄して未ログインに戻す。ネットワークエラー等では
 * セッションを残し、次の機会に再試行できるようにする。
 */
export function refreshAccessToken(
  deps: RefreshAccessTokenDeps = {
    authGateway: defaultAuthGateway,
    sessionStore: defaultSessionStore,
  },
): Promise<string | null> {
  inFlightRefresh ??= executeRefresh(deps).finally(() => {
    inFlightRefresh = null;
  });

  return inFlightRefresh;
}

async function executeRefresh(deps: RefreshAccessTokenDeps): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    return null;
  }

  const generation = getSessionGeneration();

  try {
    const session = await deps.authGateway.refreshAuthSession(refreshToken);
    const committed = await commitSession(session, generation, deps.sessionStore);
    return committed?.accessToken ?? null;
  } catch (error) {
    if (error instanceof AuthApiError && isSessionGenerationCurrent(generation)) {
      await discardSession(generation, deps.sessionStore);
    }
    return null;
  }
}

async function discardSession(generation: number, sessionStore: SessionStore): Promise<void> {
  try {
    await enqueueSessionWrite(async () => {
      if (isSessionGenerationCurrent(generation)) {
        await sessionStore.clearPersistedSession();
      }
    });
  } finally {
    if (isSessionGenerationCurrent(generation)) {
      useAuthStore.getState().logout();
    }
  }
}

/** テスト用: 進行中のリフレッシュ共有をリセットする。 */
export function resetRefreshAccessTokenForTests(): void {
  inFlightRefresh = null;
}
