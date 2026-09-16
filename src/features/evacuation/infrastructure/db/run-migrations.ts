import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import type { EvacuationDatabase } from './client';

import migrations from '../../../../../drizzle/migrations';

/** Drizzle マイグレーションを適用する。アプリ起動時に一度呼ぶ。 */
export async function runEvacuationMigrations(db: EvacuationDatabase): Promise<void> {
  await migrate(db, migrations);
}
