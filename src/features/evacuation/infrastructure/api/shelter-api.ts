import { apiFetch } from '@/shared/lib/api';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';
import type { ShelterDataset } from '../../domain/shelter-dataset-metadata';
import { isShelterDatasetMetadata } from '../../domain/shelter-dataset-metadata';

/** GET /api/v1/evacuation/shelters のレスポンス封筒。 */
type EvacuationSheltersResponse = {
  data: EvacuationShelter[];
  /** `{ source, asOf, updatedAt }`。返さないバックエンドもあり得るため未検証の型で受ける。 */
  meta: unknown;
};

/**
 * 避難所一覧とデータセットのメタデータを取得する。
 *
 * バックエンド `GET /api/v1/evacuation/shelters` を `lang` クエリ付きで呼び出す。
 * レスポンスの `data` はフィールド・enum 値ともクライアントの {@link EvacuationShelter} と
 * 一致しており変換は不要。`meta` は出典・データ基準日の表示（#492）に使うが、欠けていても
 * 避難所一覧そのものは表示できなければならないため、検証に通らない場合は null にする。
 */
export async function fetchEvacuationShelterDataset(
  language: SupportedLanguage,
): Promise<ShelterDataset<EvacuationShelter>> {
  const response = await apiFetch<EvacuationSheltersResponse>('/api/v1/evacuation/shelters', {
    query: { lang: language },
  });

  return {
    shelters: response.data,
    metadata: isShelterDatasetMetadata(response.meta) ? response.meta : null,
  };
}
