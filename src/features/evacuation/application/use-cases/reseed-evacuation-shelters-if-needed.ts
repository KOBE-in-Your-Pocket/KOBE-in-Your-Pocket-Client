import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';
import type { EvacuationShelterRepository } from '../../domain/evacuation-shelter-repository';
import type { ShelterDataset, ShelterDatasetMetadata } from '../../domain/shelter-dataset-metadata';

/** 前回の取得からこの時間が経過していれば、言語・シード版が同じでも取り直す。 */
const REFETCH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type ReseedEvacuationSheltersDeps = {
  repository: EvacuationShelterRepository;
  fetchDataset: (language: SupportedLanguage) => Promise<ShelterDataset<EvacuationShelter>>;
  language: SupportedLanguage;
  getLastSeededLanguage: () => Promise<SupportedLanguage | null>;
  setLastSeededLanguage: (language: SupportedLanguage) => Promise<void>;
  /** 現在のアプリが保存する項目のシード版。 */
  seedVersion: number;
  getLastSeededVersion: () => Promise<number | null>;
  setLastSeededVersion: (version: number) => Promise<void>;
  /** 出典・データ基準日の保存（#492）。取得できた場合のみ呼ばれる。 */
  setDatasetMetadata: (metadata: ShelterDatasetMetadata) => Promise<void>;
  /** 現在時刻（エポックミリ秒）。 */
  now: () => number;
  getLastFetchedAt: () => Promise<number | null>;
  /** 取得と SQLite への投入の両方に成功したときだけ呼ばれる。 */
  setLastFetchedAt: (fetchedAt: number) => Promise<void>;
};

/**
 * 前回の取得から {@link REFETCH_INTERVAL_MS} 以上経過しているか。
 * 記録が無い端末に加え、端末の時計が戻されて前回の日時が未来になった場合も、
 * 時計が追いつくまで更新が止まらないよう経過扱いにする。
 */
function isRefetchDue(lastFetchedAt: number | null, now: number): boolean {
  if (lastFetchedAt === null) return true;
  const elapsed = now - lastFetchedAt;
  return elapsed < 0 || elapsed >= REFETCH_INTERVAL_MS;
}

/**
 * 再シードをいつ行うか。
 * - `none`: 再シード不要
 * - `blocking`: 完了を待ってから読む。保存済みのデータが無い、または別の言語・古い項目構成で
 *   そのままでは表示できないため
 * - `background`: 24 時間経過のみ。保存済みのデータはそのまま表示できるので裏で取り直す（#694）
 */
export type ShelterReseedTiming = 'none' | 'blocking' | 'background';

export type ShelterReseedState = {
  existing: EvacuationShelter[];
  now: number;
  timing: ShelterReseedTiming;
};

/** 今回の起動で再シードが必要か、必要なら完了を待つべきかを判定する。 */
export async function readShelterReseedState(
  deps: ReseedEvacuationSheltersDeps,
): Promise<ShelterReseedState> {
  const [lastLanguage, lastVersion, lastFetchedAt, existing] = await Promise.all([
    deps.getLastSeededLanguage(),
    deps.getLastSeededVersion(),
    deps.getLastFetchedAt(),
    deps.repository.findAll(),
  ]);
  const now = deps.now();

  let timing: ShelterReseedTiming = 'none';
  if (lastLanguage !== deps.language || lastVersion !== deps.seedVersion || existing.length === 0) {
    timing = 'blocking';
  } else if (isRefetchDue(lastFetchedAt, now)) {
    timing = 'background';
  }

  return { existing, now, timing };
}

/**
 * 必要なときだけ避難所データを取得し直して SQLite に再投入する。
 *
 * 次のいずれかの場合に再フェッチする。
 * - テーブルが空（初回起動）
 * - 最後にシードした表示言語が現在の言語と異なる
 *   （表示言語の切り替え、もしくは AsyncStorage と SQLite の記録のズレ）
 * - 最後にシードしたときのシード版が現在と異なる
 *   （アプリ更新で保存する項目が増え、保存済みの行にその項目が入っていない）
 * - 前回の取得から 24 時間以上経過している（#692）
 *
 * 取得に失敗（オフライン等）しても DB に既存データがあれば、それをそのまま表示し続ける
 * ために例外を握りつぶす（避難所は防災情報のため、言語切り替えやアプリ更新時の一時的な
 * 通信断で一覧が丸ごと見られなくなるのは避けたい）。取得できなかった言語・シード版・取得日時は
 * 記録しないため、次回の起動時に改めて再取得が試みられる。DB が空で表示するものが
 * 無い場合のみ例外を伝播する。
 */
export async function reseedEvacuationSheltersIfNeeded(
  deps: ReseedEvacuationSheltersDeps,
  state?: ShelterReseedState,
): Promise<boolean> {
  const { existing, now, timing } = state ?? (await readShelterReseedState(deps));

  if (timing === 'none') {
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
  await deps.setLastSeededVersion(deps.seedVersion);
  await deps.setLastFetchedAt(now);

  // メタデータを返さないバックエンドでも避難所一覧の投入は成功扱いにする。
  // 保存済みの古い出典を消さないよう、取得できたときだけ上書きする。
  if (dataset.metadata !== null) {
    await deps.setDatasetMetadata(dataset.metadata);
  }

  return true;
}
