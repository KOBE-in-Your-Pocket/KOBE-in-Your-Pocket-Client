import { useAuthStore } from '@/features/user/store/use-auth-store';
import { ApiError } from '@/shared/lib/api';

import type { Favorite, FavoriteRepository } from '../../domain/favorite';

/**
 * backend のお気に入り API（backend#227）ができるまで使うメモリ上のモック（#790）。
 *
 * 実 API と同じく「トークンの本人」のお気に入りを扱うため、ユーザーは引数ではなく
 * ログイン中のユーザーから取る。データはアプリを動かしている間だけ残る。
 * 実 API への切り替えは #797 で行う。
 */

/** ユーザー ID → (spotId → 登録日時)。 */
const favoritesByUser = new Map<string, Map<string, string>>();

/** 通信している感じを出す遅延。押した直後に見た目が切り替わる（楽観的更新）のを実機で確かめやすくする。 */
const MOCK_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 300;

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

/** 未ログインなら実 API と同じく 401 で失敗させる。 */
function requireFavoritesOfCurrentUser(): Map<string, string> {
  const userId = useAuthStore.getState().currentUser?.id;
  if (!userId) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  let favorites = favoritesByUser.get(userId);
  if (!favorites) {
    favorites = new Map();
    favoritesByUser.set(userId, favorites);
  }
  return favorites;
}

export const mockFavoriteRepository = {
  /** 自分のお気に入りを登録日時の新しい順で返す。 */
  async fetchFavorites(): Promise<Favorite[]> {
    await wait();
    const favorites = requireFavoritesOfCurrentUser();
    return [...favorites]
      .map(([spotId, createdAt]) => ({ spotId, createdAt }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** 登録済みなら何もしない（冪等）。登録日時も最初のまま。 */
  async addFavorite(spotId: string): Promise<void> {
    await wait();
    const favorites = requireFavoritesOfCurrentUser();
    if (!favorites.has(spotId)) {
      favorites.set(spotId, new Date().toISOString());
    }
  },

  /** 未登録なら何もしない（冪等）。 */
  async removeFavorite(spotId: string): Promise<void> {
    await wait();
    requireFavoritesOfCurrentUser().delete(spotId);
  },
} satisfies FavoriteRepository;

/** テスト用。全ユーザーのお気に入りを空にする。 */
export function resetMockFavorites(): void {
  favoritesByUser.clear();
}
