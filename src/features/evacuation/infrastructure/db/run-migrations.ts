import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import type { EvacuationDatabase } from './client';

import migrations from '../../../../../drizzle/migrations';

/** Drizzle マイグレーションを適用する。適用済みの分は再度呼んでも実行されない。 */
export async function runEvacuationMigrations(db: EvacuationDatabase): Promise<void> {
  await migrate(db, migrations);
}
