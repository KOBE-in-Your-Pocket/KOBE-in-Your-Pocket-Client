import type { FavoriteRepository } from '../../domain/favorite';

import { mockFavoriteRepository } from './mock-favorites';

/**
 * お気に入りの取得・追加・削除（#775）。application 層はこのファイルだけを見る。
 *
 * backend の API（backend#227）ができるまではモックを使う（#790）。
 * 実 API への切り替え（#797）は、このファイルの中身を差し替えるだけで済むようにしている。
 */
const repository: FavoriteRepository = mockFavoriteRepository;

export const fetchFavorites = () => repository.fetchFavorites();
export const addFavorite = (spotId: string) => repository.addFavorite(spotId);
export const removeFavorite = (spotId: string) => repository.removeFavorite(spotId);
