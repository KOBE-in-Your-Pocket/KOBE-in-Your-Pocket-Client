import { apiFetch } from '@/shared/lib/api';

import type { ProfileUpdateRequest } from '../../domain/profile-edits';
import type { PublicUser } from '../../domain/public-user';

/** `GET /api/v1/users/me` と `PATCH /api/v1/users/me` のレスポンス（backend `PublicUserResponse`）。 */
type PublicUserResponse = {
  id: string;
  name: string;
  /** アイコン未設定時は null。 */
  iconUrl: string | null;
};

function toPublicUser(response: PublicUserResponse): PublicUser {
  return {
    id: response.id,
    name: response.name,
    // PublicUser.iconUrl は string のため、未設定は空文字に寄せる（auth-api と同じ扱い）。
    iconUrl: response.iconUrl ?? '',
  };
}

/**
 * ログイン中のユーザーを backend から取得する。
 *
 * `GET /api/v1/users/me` は認証必須（backend では URL ルールではなくメソッドセキュリティで
 * 守られている）。アクセストークンの付与と 401 時の再発行は `apiFetch` の `auth` が担う（#506）。
 */
export async function fetchCurrentUser(): Promise<PublicUser> {
  const response = await apiFetch<PublicUserResponse>('/api/v1/users/me', { auth: true });

  return toPublicUser(response);
}

/**
 * ログイン中のユーザーのプロフィールを部分更新する（表示名・アイコン）。
 *
 * `PATCH /api/v1/users/me` は認証必須。送ったフィールドだけが変わる。応答は更新後の
 * ユーザー情報（backend #183）。
 */
export async function updateCurrentUser(request: ProfileUpdateRequest): Promise<PublicUser> {
  const response = await apiFetch<PublicUserResponse>('/api/v1/users/me', {
    method: 'PATCH',
    body: request,
    auth: true,
  });

  return toPublicUser(response);
}

/**
 * ログイン中のユーザーを本人の意思で削除（退会）する。
 *
 * `DELETE /api/v1/users/me` は認証必須。削除対象は JWT の subject から決まり、
 * 本人以外を指定する余地は無い（backend #182）。成功時は 204、
 * 対象がすでに存在しない場合は 404 を返す（backend 側は冪等にしていない）。
 */
export async function deleteCurrentUser(): Promise<void> {
  await apiFetch<void>('/api/v1/users/me', { method: 'DELETE', auth: true });
}
