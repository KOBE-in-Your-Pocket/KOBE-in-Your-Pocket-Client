import { useMutation } from '@tanstack/react-query';

import { useReviewStore } from '@/features/tourism/store/use-review-store';

import type { PersistedUserStore, UserGateway } from '../domain/auth-ports';
import {
  normalizeProfileEdits,
  type ProfileEdits,
  type ProfileUpdateRequest,
} from '../domain/profile-edits';
import { useAuthStore } from '../store/use-auth-store';
import { defaultPersistedUserStore, defaultUserGateway } from './auth-deps';
import {
  enqueueSessionWrite,
  getSessionGeneration,
  isSessionGenerationCurrent,
} from './session-operation';

type UpdateProfileDeps = {
  persistedUserStore: PersistedUserStore;
  userGateway: Pick<UserGateway, 'updateCurrentUser'>;
};

/**
 * アカウント編集内容（表示名・アイコン）を保存する。
 *
 * 表示名は `PATCH /api/v1/users/me` で保存し、応答の値をストアと永続化に反映する。
 * 送信に失敗したときはストアも永続化も変えず、例外を呼び出し側へ伝える。
 *
 * アイコンは backend に URL を送れないため（画像の差し替えは #546 の
 * `POST /api/v1/users/me/icon`）、当面は編集値をローカルにだけ反映する。
 * この値はサーバーに保存されないため、次回起動時のユーザー同期で戻る（#546 で解消）。
 * 未設定に戻す場合（空文字）のみ PATCH で送る。
 *
 * 合わせて、自分が投稿済みのレビュー（useReviewStore の submittedReviews）の
 * author.name / author.iconUrl もその場で書き換える（#516 暫定対応）。
 */
export async function performProfileUpdate(
  edits: ProfileEdits,
  deps: UpdateProfileDeps = {
    persistedUserStore: defaultPersistedUserStore,
    userGateway: defaultUserGateway,
  },
): Promise<void> {
  const normalized = normalizeProfileEdits(edits);
  if (normalized === null) {
    throw new Error('表示名が不正です');
  }

  const { currentUser } = useAuthStore.getState();
  if (currentUser === null) {
    throw new Error('未ログインのためプロフィールを更新できません');
  }

  const request: ProfileUpdateRequest = { name: normalized.name };
  if (normalized.iconUrl === '') {
    request.iconUrl = '';
  }
  const generation = getSessionGeneration();
  const saved = await deps.userGateway.updateCurrentUser(request);

  // 送信中にサインアウト・サインインがあった場合、古い応答でセッションを書き戻さない。
  // 同じユーザーで再ログインした場合も世代で検出できるため、ID の比較は保険として残す。
  if (
    !isSessionGenerationCurrent(generation) ||
    useAuthStore.getState().currentUser?.id !== currentUser.id
  ) {
    return;
  }

  const updated = { ...currentUser, name: saved.name, iconUrl: normalized.iconUrl };
  useAuthStore.getState().updateCurrentUser(updated);
  useReviewStore.getState().updateAuthorInfo(updated.id, {
    name: updated.name,
    iconUrl: updated.iconUrl,
  });

  try {
    // 進行中のサインイン・復元・ログアウトの書き込みと交錯して古いセッションが
    // 復活しないよう直列化する（session-operation.ts 参照）。
    await enqueueSessionWrite(() => deps.persistedUserStore.updatePersistedUser(updated));
  } catch {
    // 永続化に失敗してもメモリ上の更新は維持する（次回起動時に反映されないだけ）。
  }
}

/** アカウント編集を保存する mutation。 */
export function useUpdateProfile() {
  return useMutation({ mutationFn: (edits: ProfileEdits) => performProfileUpdate(edits) });
}
