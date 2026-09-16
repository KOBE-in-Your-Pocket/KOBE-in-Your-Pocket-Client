import type { AuthSession } from '../domain/auth-session';
import type { SessionStore } from '../domain/auth-ports';
import { useAuthStore } from '../store/use-auth-store';

let sessionGeneration = 0;

/** 進行中のセッション復元を無効化する（ログアウト・新規サインイン時）。 */
export function bumpSessionGeneration(): void {
  sessionGeneration += 1;
}

/** セッション操作の世代を取得する。 */
export function getSessionGeneration(): number {
  return sessionGeneration;
}

/** 指定世代の操作がまだ有効かどうかを返す。 */
export function isSessionGenerationCurrent(generation: number): boolean {
  return sessionGeneration === generation;
}

/** テスト用: 世代カウンタをリセットする。 */
export function resetSessionGenerationForTests(): void {
  sessionGeneration = 0;
}

let sessionWriteQueue: Promise<unknown> = Promise.resolve();

/**
 * secure-store への書き込みを直列化して実行する。
 * 並行するサインイン・復元・ログアウトの書き込みが交錯し、
 * 古い操作の結果が後勝ちで残るのを防ぐ。
 */
export function enqueueSessionWrite<T>(operation: () => Promise<T>): Promise<T> {
  const task = sessionWriteQueue.then(operation);
  // 失敗しても後続の書き込みは実行する（エラーは task 側の呼び出し元へ伝播する）。
  sessionWriteQueue = task.catch(() => undefined);
  return task;
}

/**
 * セッションを secure-store へ永続化し、ストアへ反映する。
 * 書き込みは直列化され、世代確認は書き込み直前（キュー内）で行うため、
 * 待機中に別のセッション操作が始まった場合は何もせず null を返す。
 */
export function commitSession(
  session: AuthSession,
  generation: number,
  sessionStore: SessionStore,
): Promise<AuthSession | null> {
  return enqueueSessionWrite(async () => {
    if (!isSessionGenerationCurrent(generation)) {
      return null;
    }

    await sessionStore.savePersistedSession(session);
    if (!isSessionGenerationCurrent(generation)) {
      return null;
    }

    useAuthStore.getState().setSession(session);
    return session;
  });
}
