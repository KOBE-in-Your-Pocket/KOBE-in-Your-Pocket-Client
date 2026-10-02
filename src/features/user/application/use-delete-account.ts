import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';

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
 * ログアウト（{@link performSignOut}）と異なり、backend の削除が失敗した場合は
 * ローカル状態を変更せずエラーを呼び出し元へ伝播する。サーバーにアカウントが
 * 残っているのにローカルだけ消えると、利用者は退会できたのか分からなくなる（#543）。
 *
 * すでに削除済み（404）は成功として扱う。別端末で先に削除済み、または削除自体は
 * 成功したがレスポンス受信前に通信が切れた場合に、再試行しても永久に失敗し続けるのを
 * 防ぐため（レビュー削除 #526 と同じ理由。backend #182 もこの 404 は「冪等ではない」と
 * 明記しており、再試行時に起こり得る）。
 */
export async function performDeleteAccount(
  deps: DeleteAccountDeps = {
    userGateway: defaultUserGateway,
    sessionStore: defaultSessionStore,
  },
): Promise<void> {
  bumpSessionGeneration();

  try {
    await deps.userGateway.deleteCurrentUser();
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error;
    }
  }

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

/** 退会を実行する mutation。 */
export function useDeleteAccount() {
  return useMutation({ mutationFn: () => performDeleteAccount() });
}
