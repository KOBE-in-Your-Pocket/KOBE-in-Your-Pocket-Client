import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SPOTS_QUERY_KEY } from '@/features/tourism/application/use-spots';
import { SPOT_REVIEWS_QUERY_KEY } from '@/features/tourism/application/use-spot-reviews';
import { useReviewStore } from '@/features/tourism/store/use-review-store';
import { ApiError } from '@/shared/lib/api';

import type { SessionStore, UserGateway } from '../domain/auth-ports';
import { useAuthStore } from '../store/use-auth-store';
import { defaultSessionStore, defaultUserGateway } from './auth-deps';
import { bumpSessionGeneration, enqueueSessionWrite } from './session-operation';

type DeleteAccountDeps = {
  userGateway: UserGateway;
  sessionStore: SessionStore;
};

/**
 * 退会（アカウント削除）の一連の流れを実行する。
 *
 * ログアウトと異なり、削除 API が失敗した場合（404 以外）はローカル状態を変更せず
 * エラーを伝播する。サーバーにアカウントが残ったままローカルだけ消えるのを防ぐため。
 * 404 はすでに削除済みとして成功扱いにする（backend #182 がこのケースを冪等にしていないため、
 * レスポンス受信前の通信切断等からの再試行で起こり得る）。
 */
export async function performDeleteAccount(
  deps: DeleteAccountDeps = {
    userGateway: defaultUserGateway,
    sessionStore: defaultSessionStore,
  },
): Promise<void> {
  try {
    await deps.userGateway.deleteCurrentUser();
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error;
    }
  }

  // 削除確定後に世代を進める。削除前に進めると、失敗時に何も変えないはずの経路でも
  // 並行中のサインイン・リフレッシュの commitSession が古い世代扱いで失われてしまう。
  bumpSessionGeneration();

  try {
    await GoogleSignin.signOut();
  } catch {
    // 未 configure などで失敗しても退会自体は成立しているためローカルの後始末は完了させる。
  }

  try {
    // 進行中のサインイン書き込みと交錯して古いセッションが残らないよう直列化する。
    await enqueueSessionWrite(() => deps.sessionStore.clearPersistedSession());
  } finally {
    useAuthStore.getState().logout();
    useReviewStore.getState().clearSubmittedReviews();
  }
}

/** 退会を実行する mutation。成功したらレビュー一覧・評価件数のキャッシュを全スポット分無効化する。 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => performDeleteAccount(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SPOT_REVIEWS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SPOTS_QUERY_KEY });
    },
  });
}
