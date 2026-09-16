import * as SQLite from 'expo-sqlite';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import * as schema from './schema';

export const EVACUATION_DB_NAME = 'evacuation.db';

export type EvacuationDatabase = ExpoSQLiteDatabase<typeof schema>;

let database: EvacuationDatabase | null = null;

/** 避難所 feature 専用 SQLite 接続を返す（シングルトン）。 */
export function getEvacuationDatabase(): EvacuationDatabase {
  if (!database) {
    const sqlite = SQLite.openDatabaseSync(EVACUATION_DB_NAME);
    database = createEvacuationDatabase(sqlite);
  }

  return database;
}

/** テストや DI 用。expo-sqlite の DB インスタンスから Drizzle を生成する。 */
export function createEvacuationDatabase(sqlite: SQLite.SQLiteDatabase) {
  return drizzle(sqlite, { schema });
}

/** シングルトンをリセットする（テスト用）。 */
export function resetEvacuationDatabaseForTests(): void {
  database = null;
}
