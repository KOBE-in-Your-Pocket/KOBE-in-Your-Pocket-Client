import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { PersistedUserStore, UserGateway } from '../domain/auth-ports';
import { useAuthStore } from '../store/use-auth-store';
import { defaultPersistedUserStore, defaultUserGateway } from './auth-deps';
import { enqueueSessionWrite } from './session-operation';

import type { PublicUser } from '../domain/public-user';

/** 現在ユーザー取得クエリのキー名前空間。 */
export const CURRENT_USER_QUERY_KEY = ['user', 'me'] as const;

/** サーバー側の変更を取りに行く間隔。頻繁に変わる情報ではないので長めに取る。 */
const STALE_TIME_MS = 5 * 60 * 1000;

type SyncCurrentUserDeps = {
  userGateway: UserGateway;
  persistedUserStore: PersistedUserStore;
};

const defaultDeps: SyncCurrentUserDeps = {
  userGateway: defaultUserGateway,
  persistedUserStore: defaultPersistedUserStore,
};

/**
 * 取得した現在ユーザーを認証ストアと永続化済みセッションへ反映する。
 *
 * ログアウトや別ユーザーへの切替と取得が交錯した場合に古いユーザーで
 * 上書きしないよう、反映直前に ID が一致しているかを確認する。
 */
export async function applyCurrentUser(
  user: PublicUser,
  persistedUserStore: PersistedUserStore = defaultPersistedUserStore,
): Promise<void> {
  const { currentUser, updateCurrentUser } = useAuthStore.getState();
  if (currentUser === null || currentUser.id !== user.id) {
    return;
  }

  updateCurrentUser(user);

  try {
    // 進行中のサインイン・復元・ログアウトの書き込みと交錯しないよう直列化する
    // （session-operation.ts 参照）。
    await enqueueSessionWrite(() => persistedUserStore.updatePersistedUser(user));
  } catch {
    // 永続化に失敗してもメモリ上の反映は維持する（次回起動時に反映されないだけ）。
  }
}

/**
 * ログイン中のユーザーを `GET /api/v1/users/me` から取得し、認証ストアへ同期する。
 *
 * サインイン・セッション復元のレスポンスにもユーザーは含まれるが、それらは
 * ログイン時・起動時の一度きり。この hook はアプリ利用中にサーバー側で変わった
 * 表示名・アイコンを取り込むためのもの。未ログイン時は取得しない。
 *
 * backend にプロフィール更新 API が無いため同期は取得方向のみ。取得に失敗しても
 * ローカルのユーザー情報をそのまま使い続ける（表示が壊れないことを優先する）。
 */
export function useSyncCurrentUser(deps: SyncCurrentUserDeps = defaultDeps): void {
  const userId = useAuthStore((state) => state.currentUser?.id ?? null);
  const { userGateway, persistedUserStore } = deps;

  const { data } = useQuery<PublicUser>({
    queryKey: [...CURRENT_USER_QUERY_KEY, userId],
    enabled: userId !== null,
    queryFn: () => userGateway.fetchCurrentUser(),
    staleTime: STALE_TIME_MS,
  });

  useEffect(() => {
    if (data) {
      void applyCurrentUser(data, persistedUserStore);
    }
  }, [data, persistedUserStore]);
}
