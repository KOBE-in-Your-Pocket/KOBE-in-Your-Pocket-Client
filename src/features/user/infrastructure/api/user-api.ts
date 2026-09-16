import { apiFetch } from '@/shared/lib/api';

import type { PublicUser } from '../../domain/public-user';

/** `GET /api/v1/users/me` のレスポンス（backend `PublicUserResponse`）。 */
type PublicUserResponse = {
  id: string;
  name: string;
  /** アイコン未設定時は null。 */
  iconUrl: string | null;
};

/**
 * ログイン中のユーザーを backend から取得する。
 *
 * `GET /api/v1/users/me` は認証必須（backend では URL ルールではなくメソッドセキュリティで
 * 守られている）。アクセストークンの付与と 401 時の再発行は `apiFetch` の `auth` が担う（#506）。
 */
export async function fetchCurrentUser(): Promise<PublicUser> {
  const response = await apiFetch<PublicUserResponse>('/api/v1/users/me', { auth: true });

  return {
    id: response.id,
    name: response.name,
    // PublicUser.iconUrl は string のため、未設定は空文字に寄せる（auth-api と同じ扱い）。
    iconUrl: response.iconUrl ?? '',
  };
}
