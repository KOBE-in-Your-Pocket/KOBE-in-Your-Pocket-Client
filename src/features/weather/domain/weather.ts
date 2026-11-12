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

const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/;

// ISO 8601 をエポックミリ秒にする（読めなければ null）。backend はマイクロ秒まで返すため小数部は自前で読む
export function parseWeatherTime(value: string): number | null {
  const match = ISO_DATE_TIME.exec(value);
  if (match === null) {
    return null;
  }

  const [, dateTime, fraction = '', zone] = match;
  const epochMs = Date.parse(`${dateTime}${zone}`);
  if (Number.isNaN(epochMs)) {
    return null;
  }

  return epochMs + Number(fraction.padEnd(3, '0').slice(0, 3));
}
