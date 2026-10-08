import { useMutation } from '@tanstack/react-query';

import { useReviewStore } from '@/features/tourism/store/use-review-store';

import type { PersistedUserStore, UserGateway } from '../domain/auth-ports';
import {
  normalizeProfileEdits,
  type ProfileEdits,
  type ProfileUpdateRequest,
} from '../domain/profile-edits';
import type { PublicUser } from '../domain/public-user';
import { useAuthStore } from '../store/use-auth-store';
import { defaultPersistedUserStore, defaultUserGateway } from './auth-deps';
import {
  enqueueSessionWrite,
  getSessionGeneration,
  isSessionGenerationCurrent,
} from './session-operation';

type UpdateProfileDeps = {
  persistedUserStore: PersistedUserStore;
  userGateway: Pick<UserGateway, 'updateCurrentUser' | 'uploadMyIcon'>;
};

/**
 * アカウント編集内容（表示名・アイコン）を保存する。
 *
 * 表示名は `PATCH /api/v1/users/me` で保存する。アイコンを新しく選んでいた場合
 * （`newIconUri` あり）は続けて `POST /api/v1/users/me/icon` でアップロードする。
 * この 2 つは backend 上は独立した呼び出しのため、表示名の保存が成功した時点で
 * ストア・永続化へ反映する。アイコンのアップロードはその後に失敗しうるが、
 * その場合も表示名の反映は巻き戻さない（backend 側はすでに新しい表示名を
 * 保持しており、反映しないと次回の fetchCurrentUser で無言で値が変わってしまう）。
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

  if (!isSessionStillCurrent(generation, currentUser.id)) {
    return;
  }

  let updated = { ...currentUser, name: saved.name, iconUrl: normalized.iconUrl };
  await applyUpdatedUser(updated, deps.persistedUserStore);

  if (normalized.newIconUri) {
    const uploaded = await deps.userGateway.uploadMyIcon(normalized.newIconUri);

    if (!isSessionStillCurrent(generation, currentUser.id)) {
      return;
    }

    updated = { ...updated, iconUrl: uploaded.iconUrl };
    await applyUpdatedUser(updated, deps.persistedUserStore);
  }
}

// 送信中にサインアウト・サインインがあった場合、古い応答でセッションを書き戻さない。
// 同じユーザーで再ログインした場合も世代で検出できるため、ID の比較は保険として残す。
function isSessionStillCurrent(generation: number, userId: string): boolean {
  return (
    isSessionGenerationCurrent(generation) && useAuthStore.getState().currentUser?.id === userId
  );
}

async function applyUpdatedUser(
  updated: PublicUser,
  persistedUserStore: PersistedUserStore,
): Promise<void> {
  useAuthStore.getState().updateCurrentUser(updated);
  useReviewStore.getState().updateAuthorInfo(updated.id, {
    name: updated.name,
    iconUrl: updated.iconUrl,
  });

  try {
    // 進行中のサインイン・復元・ログアウトの書き込みと交錯して古いセッションが
    // 復活しないよう直列化する（session-operation.ts 参照）。
    await enqueueSessionWrite(() => persistedUserStore.updatePersistedUser(updated));
  } catch {
    // 永続化に失敗してもメモリ上の更新は維持する（次回起動時に反映されないだけ）。
  }
}

/** アカウント編集を保存する mutation。 */
export function useUpdateProfile() {
  return useMutation({ mutationFn: (edits: ProfileEdits) => performProfileUpdate(edits) });
}
