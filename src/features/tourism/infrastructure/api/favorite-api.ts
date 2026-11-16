import { apiFetch } from '@/shared/lib/api';

import type { Favorite, FavoriteRepository } from '../../domain/favorite';

/**
 * お気に入りの取得・追加・削除（#775）。application 層はこのファイルだけを見る。
 *
 * backend のお気に入り API（backend#227）を呼ぶ（#797）。3 つとも認証必須なので `auth: true` で送り、
 * トークンの再発行と再試行は `apiFetch` に任せる。失敗（401・404 など）は `ApiError` のまま投げ、
 * 元に戻す処理は呼び出し側（useToggleFavorite）が行う。
 */
const FAVORITES_PATH = '/api/v1/users/me/favorites';

function favoritePath(spotId: string): string {
  return `${FAVORITES_PATH}/${encodeURIComponent(spotId)}`;
}

const apiFavoriteRepository = {
  /**
   * `GET /api/v1/users/me/favorites`。自分のお気に入りを登録日時の新しい順で返す（0 件なら空配列）。
   * 応答は {@link Favorite} と同じ形なので、変換せずに返す。
   */
  fetchFavorites: () => apiFetch<Favorite[]>(FAVORITES_PATH, { auth: true }),

  /** `PUT /api/v1/users/me/favorites/{spotId}`。登録済みでも成功する（冪等）。スポットが無ければ 404。 */
  addFavorite: (spotId: string) =>
    apiFetch<void>(favoritePath(spotId), { method: 'PUT', auth: true }),

  /** `DELETE /api/v1/users/me/favorites/{spotId}`。未登録でも成功する（冪等）。 */
  removeFavorite: (spotId: string) =>
    apiFetch<void>(favoritePath(spotId), { method: 'DELETE', auth: true }),
} satisfies FavoriteRepository;

export const { fetchFavorites, addFavorite, removeFavorite } = apiFavoriteRepository;
