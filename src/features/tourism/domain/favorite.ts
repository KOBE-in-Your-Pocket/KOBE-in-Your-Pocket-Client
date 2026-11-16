/**
 * ユーザーがお気に入り登録した観光スポット（#775）。
 *
 * backend の `GET /api/v1/users/me/favorites` の 1 件と同じ形。
 * スポットの中身（名前・画像など）は持たず、表示するときは `useSpots()` の
 * キャッシュから `spotId` で探す（多言語化をクライアント側の 1 か所にまとめるため）。
 *
 * backend の API ができるまでの仮の形。確定したら #797 で見直す。
 */
export type Favorite = {
  spotId: string;
  /** 登録日時（ISO 8601）。一覧を新しい順に並べるのに使う。 */
  createdAt: string;
};

/**
 * お気に入りの取得・追加・削除の形。
 *
 * モック（#790）も実 API（#797）もこの形で作る。そうすれば、切り替えるときに
 * application 層を変えなくて済む。3 つとも認証必須で、未ログインなら 401 で失敗する。
 * 追加・削除は冪等（登録済みの追加や、未登録の削除も成功扱い）。
 */
export type FavoriteRepository = {
  fetchFavorites(): Promise<Favorite[]>;
  addFavorite(spotId: string): Promise<void>;
  removeFavorite(spotId: string): Promise<void>;
};

/**
 * お気に入りに、表示に使うスポットの情報を引き当てる（#795）。
 *
 * - スポット一覧に無い ID（非公開・削除済みなど）は表示しないので捨てる。
 * - 並びは登録日時（`createdAt`）の新しい順。API も新しい順で返すが、楽観的更新で
 *   足した分とずれても困らないよう、ここで並べ直す。
 */
export function joinFavoriteSpots<TSpot extends { id: string }>(
  favorites: readonly Favorite[],
  spots: readonly TSpot[],
): TSpot[] {
  const spotsById = new Map(spots.map((spot) => [spot.id, spot]));

  return [...favorites]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((favorite) => {
      const spot = spotsById.get(favorite.spotId);
      return spot ? [spot] : [];
    });
}
