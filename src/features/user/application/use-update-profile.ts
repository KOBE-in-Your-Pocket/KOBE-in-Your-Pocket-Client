import { useMutation } from '@tanstack/react-query';

import { useReviewStore } from '@/features/tourism/store/use-review-store';

import type { PersistedUserStore } from '../domain/auth-ports';
import { normalizeProfileEdits, type ProfileEdits } from '../domain/profile-edits';
import { useAuthStore } from '../store/use-auth-store';
import { defaultPersistedUserStore } from './auth-deps';
import { enqueueSessionWrite } from './session-operation';

type UpdateProfileDeps = {
  persistedUserStore: PersistedUserStore;
};

/**
 * アカウント編集内容（表示名・アイコン）を保存する。
 *
 * backend にプロフィール更新 API が未提供のため（#402 時点）、更新は
 * ローカル（認証ストア + 永続化済みセッション）にのみ反映する。
 * API が提供されたら deps にゲートウェイを追加してここから呼び出す。
 *
 * 既知の制約: セッション再発行（/auth/refresh）はサーバー側のユーザー情報を
 * 返すため、次回のセッション復元時にローカルの編集内容はサーバー側の値で
 * 上書きされる。backend API 提供までの割り切り。
 *
 * 合わせて、自分が投稿済みのレビュー（useReviewStore の submittedReviews）の
 * author.name / author.iconUrl もその場で書き換える（#516 暫定対応）。
 */
export async function performProfileUpdate(
  edits: ProfileEdits,
  deps: UpdateProfileDeps = { persistedUserStore: defaultPersistedUserStore },
): Promise<void> {
  const normalized = normalizeProfileEdits(edits);
  if (normalized === null) {
    throw new Error('表示名が不正です');
  }

  const { currentUser, updateCurrentUser } = useAuthStore.getState();
  if (currentUser === null) {
    throw new Error('未ログインのためプロフィールを更新できません');
  }

  const updated = { ...currentUser, ...normalized };
  updateCurrentUser(updated);
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
