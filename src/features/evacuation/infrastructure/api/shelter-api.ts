import { apiFetch } from '@/shared/lib/api';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import {
  DISASTER_TYPES,
  isShelterSuitability,
  type EvacuationShelter,
  type ShelterSuitabilityByDisaster,
} from '../../domain/evacuation-shelter';
import type { ShelterDataset } from '../../domain/shelter-dataset-metadata';
import { isShelterDatasetMetadata } from '../../domain/shelter-dataset-metadata';

/**
 * 避難所 1 件のレスポンス。
 *
 * - 電話番号が未登録の避難所では `phoneNumber` がフィールドごと欠落する
 *   （null / 空文字で返ってきても未登録として扱う）。
 * - `suitability` は `{ landslide, flood, tsunami, 'large-fire' }` の各値に適否が入る。
 *   返さない backend や未知の値があっても一覧を壊さないよう、未検証の型で受ける。
 */
type EvacuationShelterResponse = Omit<EvacuationShelter, 'phoneNumber' | 'suitability'> & {
  phoneNumber?: string | null;
  suitability?: unknown;
};

/** GET /api/v1/evacuation/shelters のレスポンス封筒。 */
type EvacuationSheltersResponse = {
  data: EvacuationShelterResponse[];
  /** `{ source, asOf, updatedAt }`。返さないバックエンドもあり得るため未検証の型で受ける。 */
  meta: unknown;
};

/**
 * 避難所一覧とデータセットのメタデータを取得する。
 *
 * バックエンド `GET /api/v1/evacuation/shelters` を `lang` クエリ付きで呼び出す。
 * レスポンスの `data` はフィールド・enum 値ともクライアントの {@link EvacuationShelter} と
 * 一致しており、変換は未登録の電話番号（`phoneNumber`）を undefined に揃えることと、
 * 災害種別ごとの適否（`suitability`）から既知の値だけを取り込むことに限る。
 * `meta` は出典・データ基準日の表示（#492）に使うが、欠けていても
 * 避難所一覧そのものは表示できなければならないため、検証に通らない場合は null にする。
 */
export async function fetchEvacuationShelterDataset(
  language: SupportedLanguage,
): Promise<ShelterDataset<EvacuationShelter>> {
  const response = await apiFetch<EvacuationSheltersResponse>('/api/v1/evacuation/shelters', {
    query: { lang: language },
  });

  return {
    shelters: response.data.map(toEvacuationShelter),
    metadata: isShelterDatasetMetadata(response.meta) ? response.meta : null,
  };
}

/**
 * レスポンスをドメインへ変換する。未登録の電話番号（欠落 / null / 空文字 / 空白のみ）と、
 * 情報の無い災害種別ごとの適否は undefined に揃える。
 */
function toEvacuationShelter({
  phoneNumber,
  suitability,
  ...shelter
}: EvacuationShelterResponse): EvacuationShelter {
  const trimmedPhoneNumber = phoneNumber?.trim();
  const knownSuitability = toSuitabilityByDisaster(suitability);

  return {
    ...shelter,
    ...(trimmedPhoneNumber ? { phoneNumber: trimmedPhoneNumber } : {}),
    ...(knownSuitability ? { suitability: knownSuitability } : {}),
  };
}

/**
 * 既知の災害種別・既知の適否だけを取り込む。backend が災害種別や値を増やしても、
 * クライアントが知らないものは無視して残りを表示できるようにする。
 * 1 種別も取り込めなければ undefined を返す。
 */
function toSuitabilityByDisaster(value: unknown): ShelterSuitabilityByDisaster | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const result: ShelterSuitabilityByDisaster = {};
  for (const disasterType of DISASTER_TYPES) {
    const suitability = source[disasterType];
    if (isShelterSuitability(suitability)) {
      result[disasterType] = suitability;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
