// 降水強度（at は ISO 8601 の UTC、mmPerHour は小数のまま。雨なしは 0 とする）
export type Rainfall = {
  at: string;
  mmPerHour: number;
};

// 天気（取得に失敗しても前回のデータを返し、fetchedAt は前回の値のままとする）
export type Weather = {
  fetchedAt: string;
  // null にはならない
  observation: Rainfall;
  // 時刻の昇順。件数は決め打ちしない（0 件もありうる）
  forecasts: Rainfall[];
};
