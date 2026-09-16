import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';
import type { EvacuationShelterRepository } from '../../domain/evacuation-shelter-repository';
import type { ShelterDataset, ShelterDatasetMetadata } from '../../domain/shelter-dataset-metadata';

export type ReseedEvacuationSheltersDeps = {
  repository: EvacuationShelterRepository;
  fetchDataset: (language: SupportedLanguage) => Promise<ShelterDataset<EvacuationShelter>>;
  language: SupportedLanguage;
  getLastSeededLanguage: () => Promise<SupportedLanguage | null>;
  setLastSeededLanguage: (language: SupportedLanguage) => Promise<void>;
  /** 出典・データ基準日の保存（#492）。取得できた場合のみ呼ばれる。 */
  setDatasetMetadata: (metadata: ShelterDatasetMetadata) => Promise<void>;
};

/**
 * 必要なときだけ避難所データを取得し直して SQLite に再投入する。
 *
 * テーブルが空（初回起動）、または最後にシードした表示言語が現在の言語と異なる
 * （表示言語の切り替え、もしくは AsyncStorage と SQLite の記録のズレ）場合に再フェッチする。
 *
 * 取得に失敗（オフライン等）しても DB に既存データがあれば、それをそのまま表示し続ける
 * ために例外を握りつぶす（避難所は防災情報のため、言語切り替え時の一時的な通信断で
 * 一覧が丸ごと見られなくなるのは避けたい）。取得できなかった言語は記録しないため、
 * 次回オンライン復帰時に改めて再取得が試みられる。DB が空で表示するものが無い場合のみ
 * 例外を伝播する。
 */
export async function reseedEvacuationSheltersIfNeeded(
  deps: ReseedEvacuationSheltersDeps,
): Promise<boolean> {
  const [lastLanguage, existing] = await Promise.all([
    deps.getLastSeededLanguage(),
    deps.repository.findAll(),
  ]);

  if (lastLanguage === deps.language && existing.length > 0) {
    return false;
  }

  let dataset: ShelterDataset<EvacuationShelter>;
  try {
    dataset = await deps.fetchDataset(deps.language);
  } catch (error) {
    if (existing.length > 0) {
      return false;
    }
    throw error;
  }

  await deps.repository.replaceAll(dataset.shelters);
  await deps.setLastSeededLanguage(deps.language);

  // メタデータを返さないバックエンドでも避難所一覧の投入は成功扱いにする。
  // 保存済みの古い出典を消さないよう、取得できたときだけ上書きする。
  if (dataset.metadata !== null) {
    await deps.setDatasetMetadata(dataset.metadata);
  }

  return true;
}
