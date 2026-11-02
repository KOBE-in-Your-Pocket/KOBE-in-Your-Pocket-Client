import type { SupportedLanguage } from '@/shared/lib/i18n';

import { fetchEvacuationShelterDataset } from '../../infrastructure/api/shelter-api';
import { getEvacuationDatabase } from '../../infrastructure/db/client';
import { runEvacuationMigrations } from '../../infrastructure/db/run-migrations';
import { EVACUATION_SHELTERS_SEED_VERSION } from '../../infrastructure/db/schema';
import { createSqliteEvacuationShelterRepository } from '../../infrastructure/db/sqlite-evacuation-shelter-repository';
import { setShelterDatasetMetadata } from '../../infrastructure/storage/shelter-dataset-metadata-storage';
import {
  getLastSeededShelterLanguage,
  setLastSeededShelterLanguage,
} from '../../infrastructure/storage/shelter-language-storage';
import {
  getShelterLastFetchedAt,
  setShelterLastFetchedAt,
} from '../../infrastructure/storage/shelter-last-fetched-at-storage';
import {
  getLastSeededShelterVersion,
  setLastSeededShelterVersion,
} from '../../infrastructure/storage/shelter-seed-version-storage';

import {
  readShelterReseedState,
  reseedEvacuationSheltersIfNeeded,
  type ReseedEvacuationSheltersDeps,
} from './reseed-evacuation-shelters-if-needed';

export type EvacuationDatabaseBootstrapResult = {
  /**
   * 再シードで DB が書き換わったか。裏で取り直している間は未解決のままで、
   * 失敗しても reject せず false になる。
   */
  reseeded: Promise<boolean>;
};

let bootstrapPromise: Promise<EvacuationDatabaseBootstrapResult> | null = null;
let bootstrapLanguage: SupportedLanguage | null = null;
let backgroundReseed: Promise<boolean> | null = null;
let runningBootstraps = 0;

async function doBootstrapEvacuationDatabase(
  language: SupportedLanguage,
): Promise<EvacuationDatabaseBootstrapResult> {
  // 裏の取り直しと並行に書き込むと SQLite と AsyncStorage の順序がずれる（#487）ので完了を待つ。
  await backgroundReseed;

  const db = getEvacuationDatabase();
  await runEvacuationMigrations(db);

  const repository = createSqliteEvacuationShelterRepository(db);
  const deps: ReseedEvacuationSheltersDeps = {
    repository,
    fetchDataset: fetchEvacuationShelterDataset,
    language,
    getLastSeededLanguage: getLastSeededShelterLanguage,
    setLastSeededLanguage: setLastSeededShelterLanguage,
    seedVersion: EVACUATION_SHELTERS_SEED_VERSION,
    getLastSeededVersion: getLastSeededShelterVersion,
    setLastSeededVersion: setLastSeededShelterVersion,
    setDatasetMetadata: setShelterDatasetMetadata,
    now: Date.now,
    getLastFetchedAt: getShelterLastFetchedAt,
    setLastFetchedAt: setShelterLastFetchedAt,
  };

  const state = await readShelterReseedState(deps);
  if (state.timing === 'none') {
    return { reseeded: Promise.resolve(false) };
  }
  if (state.timing === 'blocking') {
    return { reseeded: Promise.resolve(await reseedEvacuationSheltersIfNeeded(deps, state)) };
  }

  const reseeded: Promise<boolean> = reseedEvacuationSheltersIfNeeded(deps, state)
    .catch((error: unknown) => {
      console.error('[evacuation] Failed to refresh shelters in background:', error);
      return false;
    })
    .finally(() => {
      if (backgroundReseed === reseeded) {
        backgroundReseed = null;
      }
    });
  backgroundReseed = reseeded;
  return { reseeded };
}

/**
 * 避難所ローカル DB を bootstrap する。
 *
 * 保存済みのデータをそのまま表示できる 24 時間経過の取り直しは完了を待たずに解決するので、
 * 読み手は通信を待たない（#694）。取り直しの結果は `reseeded` で受け取る。
 *
 * 同じ言語での呼び出しは進行中/完了済みの Promise を共有する。異なる言語での
 * 呼び出しが来た場合は、並行実行による SQLite と AsyncStorage の書き込み順序の
 * 不整合（#487）を避けるため、現在の実行の後に直列で繋いで実行する。
 */
export function bootstrapEvacuationDatabase(
  language: SupportedLanguage,
): Promise<EvacuationDatabaseBootstrapResult> {
  if (bootstrapPromise && bootstrapLanguage === language) {
    return bootstrapPromise;
  }

  const previous = bootstrapPromise ?? Promise.resolve();
  bootstrapLanguage = language;
  runningBootstraps += 1;
  const current: Promise<EvacuationDatabaseBootstrapResult> = previous
    .catch(() => undefined)
    .then(() => doBootstrapEvacuationDatabase(language))
    .catch((error: unknown) => {
      // 自分より後の呼び出しが既に bootstrapPromise を差し替えている場合、
      // その新しい進行中の実行の追跡状態を巻き添えでクリアしないようにする。
      if (bootstrapPromise === current) {
        bootstrapPromise = null;
        bootstrapLanguage = null;
      }
      throw error;
    })
    .finally(() => {
      runningBootstraps -= 1;
    });
  bootstrapPromise = current;
  return current;
}

/**
 * bootstrap の結果の使い回しをやめて、再シードが必要かを判定し直す（#760）。
 * アプリがフォアグラウンドに戻ったときに呼ばれる。
 *
 * bootstrap や裏の取り直しの実行中は何もしない。後ろに連結すると、読み手が
 * その通信の完了まで待たされるため。実行中の処理の結果は、それを始めた呼び出し側が受け取る。
 */
export function recheckEvacuationDatabase(
  language: SupportedLanguage,
): Promise<EvacuationDatabaseBootstrapResult> {
  if (runningBootstraps > 0 || backgroundReseed !== null) {
    return Promise.resolve({ reseeded: Promise.resolve(false) });
  }

  bootstrapPromise = null;
  return bootstrapEvacuationDatabase(language);
}

export function resetEvacuationDatabaseBootstrapForTests(): void {
  bootstrapPromise = null;
  bootstrapLanguage = null;
  backgroundReseed = null;
  runningBootstraps = 0;
}
