import type { SupportedLanguage } from '@/shared/lib/i18n';

import { fetchEvacuationShelterDataset } from '../../infrastructure/api/shelter-api';
import { getEvacuationDatabase } from '../../infrastructure/db/client';
import { runEvacuationMigrations } from '../../infrastructure/db/run-migrations';
import { createSqliteEvacuationShelterRepository } from '../../infrastructure/db/sqlite-evacuation-shelter-repository';
import { setShelterDatasetMetadata } from '../../infrastructure/storage/shelter-dataset-metadata-storage';
import {
  getLastSeededShelterLanguage,
  setLastSeededShelterLanguage,
} from '../../infrastructure/storage/shelter-language-storage';

import { reseedEvacuationSheltersIfNeeded } from './reseed-evacuation-shelters-if-needed';

let bootstrapPromise: Promise<void> | null = null;
let bootstrapLanguage: SupportedLanguage | null = null;

async function doBootstrapEvacuationDatabase(language: SupportedLanguage): Promise<void> {
  const db = getEvacuationDatabase();
  await runEvacuationMigrations(db);

  const repository = createSqliteEvacuationShelterRepository(db);
  await reseedEvacuationSheltersIfNeeded({
    repository,
    fetchDataset: fetchEvacuationShelterDataset,
    language,
    getLastSeededLanguage: getLastSeededShelterLanguage,
    setLastSeededLanguage: setLastSeededShelterLanguage,
    setDatasetMetadata: setShelterDatasetMetadata,
  });
}

/**
 * 避難所ローカル DB を bootstrap する。
 *
 * 同じ言語での呼び出しは進行中/完了済みの Promise を共有する。異なる言語での
 * 呼び出しが来た場合は、並行実行による SQLite と AsyncStorage の書き込み順序の
 * 不整合（#487）を避けるため、現在の実行の後に直列で繋いで実行する。
 */
export function bootstrapEvacuationDatabase(language: SupportedLanguage): Promise<void> {
  if (bootstrapPromise && bootstrapLanguage === language) {
    return bootstrapPromise;
  }

  const previous = bootstrapPromise ?? Promise.resolve();
  bootstrapLanguage = language;
  const current: Promise<void> = previous
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
    });
  bootstrapPromise = current;
  return current;
}

export function resetEvacuationDatabaseBootstrapForTests(): void {
  bootstrapPromise = null;
  bootstrapLanguage = null;
}
