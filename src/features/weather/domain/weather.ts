/**
 * 天気データの型。`GET /api/v1/weather` のレスポンスに対応する。
 *
 * backend がバッチで 15 分ごとに Yahoo! 気象情報API から取得した降水強度を、
 * クライアント向けに整形して返す想定の形。Yahoo! のレスポンス
 * （`WeatherList.Weather[]` の `Type` / `Date` / `Rainfall`）のうち、`Type` で
 * 観測値（`observation`）と予測値（`forecasts`）を分け、時刻は ISO 8601（UTC）に揃えている。
 * 取得地点は backend 側で固定しており、クライアントは地点を扱わない。
 *
 * データは最大 15 分古いため、クライアントは表示時点の時刻を基準に
 * 「今の降水強度」（時刻が現在以前で最も新しいもの）を選び直して使う。
 */

/** ある時刻の降水強度。Yahoo! の `Weather` 1 件（`Date` / `Rainfall`）に対応する。 */
export type Rainfall = {
  /** 対象時刻（ISO 8601、UTC。例: `2026-11-12T05:35:00Z`）。Yahoo! の `Date` を変換したもの。 */
  at: string;
  /** 降水強度（mm/h）。雨が降っていなければ 0。 */
  mmPerHour: number;
};

/** 天気 API のレスポンス全体。 */
export type Weather = {
  /**
   * backend が Yahoo! から最後に取得に成功した日時（ISO 8601、UTC）。
   * 取得に失敗したときは前回のデータをこの日時のまま返すため、クライアントはこれが
   * 30 分より古ければ「天気を取得できませんでした」として扱う。
   */
  fetchedAt: string;
  /** 取得時点の観測値。Yahoo! の `Type: "observation"`。 */
  observation: Rainfall;
  /**
   * 予測値（Yahoo! の `Type: "forecast"`）。10 分刻みで 60 分先まで、時刻の昇順。
   * 件数は決め打ちしない（0 件もありうる）。
   */
  forecasts: Rainfall[];
};
