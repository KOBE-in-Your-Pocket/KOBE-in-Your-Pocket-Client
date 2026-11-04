/**
 * 避難所データセットの出所を示すメタデータ。
 *
 * 避難所は災害時に参照される安全情報のため、どこの誰が公開したデータをいつ時点で
 * 取り込んだものかを画面に明示する（App Store Guideline 1.1 / 5.1.5、および
 * 利用者保護の観点）。バックエンド `GET /api/v1/evacuation/shelters` の `meta` に対応する。
 */
export type ShelterDatasetMetadata = {
  /** データの出典（例: 神戸市オープンデータ）。 */
  source: string;
  /** データ基準日（`YYYY-MM-DD`）。元データがいつ時点の内容か。 */
  asOf: string;
  /** バックエンドがデータセットを最後に更新した日時（ISO 8601）。 */
  updatedAt: string;
};

/** 避難所一覧とそのデータセットメタデータの組。 */
export type ShelterDataset<TShelter> = {
  shelters: TShelter[];
  /** メタデータを返さないバックエンドと通信した場合は null。 */
  metadata: ShelterDatasetMetadata | null;
};

/**
 * バックエンドの `meta` を {@link ShelterDatasetMetadata} として受け取れるか検証する。
 *
 * 出典・基準日は「表示できないなら出さない」方が誠実なため、欠けている場合は
 * 型を満たさないものとして扱い、UI 側で出典欄ごと非表示にする。
 */
export function isShelterDatasetMetadata(value: unknown): value is ShelterDatasetMetadata {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.source === 'string' &&
    candidate.source !== '' &&
    typeof candidate.asOf === 'string' &&
    candidate.asOf !== '' &&
    typeof candidate.updatedAt === 'string' &&
    candidate.updatedAt !== ''
  );
}

/** 秒の小数部・タイムゾーンを分けて取り出すための ISO 8601（日時＋タイムゾーン必須）の形。 */
const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/;

/**
 * `updatedAt`（ISO 8601）をエポックマイクロ秒に変換する。解析できなければ null。
 *
 * backend は `2026-09-29T15:13:20.984244Z` のようにマイクロ秒まで返す。`Date.parse` は
 * ミリ秒より細かい桁の扱いが JS エンジンによって異なりうるうえ、ミリ秒に丸めると
 * 同じミリ秒内の更新を区別できないため、小数部は自前で読む。
 */
export function parseShelterDatasetUpdatedAt(value: string): number | null {
  const match = ISO_DATE_TIME.exec(value);
  if (match === null) {
    return null;
  }

  const [, dateTime, fraction = '', zone] = match;
  const epochMs = Date.parse(`${dateTime}${zone}`);
  if (Number.isNaN(epochMs)) {
    return null;
  }

  const micros = Number(fraction.padEnd(6, '0').slice(0, 6));
  return epochMs * 1000 + micros;
}
