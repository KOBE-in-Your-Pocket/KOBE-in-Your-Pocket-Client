// 降水強度（at は ISO 8601 の UTC、mmPerHour は mm/h とする）
export type Rainfall = {
  at: string;
  mmPerHour: number;
};

// 天気（fetchedAt は最後に取得に成功した日時、forecasts は 10 分刻みで 60 分先までとする）
export type Weather = {
  fetchedAt: string;
  observation: Rainfall;
  forecasts: Rainfall[];
};
