import { useQuery } from '@tanstack/react-query';

import type { ShelterDatasetMetadata } from '../../domain/shelter-dataset-metadata';
import { getShelterDatasetMetadata } from '../../infrastructure/storage/shelter-dataset-metadata-storage';

/**
 * 避難所データセットのメタデータのクエリキー。
 *
 * 一覧（`EVACUATION_SHELTERS_QUERY_KEY`）と同じ `['evacuation', 'shelters']` 名前空間に
 * 属する。一覧側の定数を import して組み立てないのは、UI テストが一覧フックのモジュールを
 * まるごとモックするため、そこから定数を辿ると解決できなくなるから。名前空間を変える際は
 * 両方を直すこと。
 */
export const EVACUATION_SHELTERS_METADATA_QUERY_KEY = [
  'evacuation',
  'shelters',
  'metadata',
] as const;

/**
 * 保存済みの避難所データセットの出典・データ基準日を読む application 層フック。
 *
 * 端末に保存された値を読むだけなのでオフラインでも表示できる。まだ一度も同期して
 * いない場合は `data` が null になり、UI 側は出典欄を出さない。
 */
export function useShelterDatasetMetadata() {
  return useQuery<ShelterDatasetMetadata | null>({
    queryKey: EVACUATION_SHELTERS_METADATA_QUERY_KEY,
    queryFn: () => getShelterDatasetMetadata(),
  });
}
