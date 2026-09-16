import { eq } from 'drizzle-orm';

import type { EvacuationShelterRepository } from '../../domain/evacuation-shelter-repository';
import type { EvacuationShelter } from '../../domain/evacuation-shelter';

import type { EvacuationDatabase } from './client';
import { toEvacuationShelter, toEvacuationShelterRecord } from './evacuation-shelter-mapper';
import { evacuationShelters } from './schema';

/** SQLite + Drizzle による {@link EvacuationShelterRepository} 実装。 */
export class SqliteEvacuationShelterRepository implements EvacuationShelterRepository {
  constructor(private readonly db: EvacuationDatabase) {}

  async findAll(): Promise<EvacuationShelter[]> {
    const rows = await this.db.select().from(evacuationShelters);
    return rows.map(toEvacuationShelter);
  }

  async findById(id: string): Promise<EvacuationShelter | null> {
    const rows = await this.db
      .select()
      .from(evacuationShelters)
      .where(eq(evacuationShelters.id, id));

    const row = rows[0];
    return row ? toEvacuationShelter(row) : null;
  }

  async replaceAll(shelters: EvacuationShelter[]): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(evacuationShelters).run();

      if (shelters.length === 0) {
        return;
      }

      tx.insert(evacuationShelters).values(shelters.map(toEvacuationShelterRecord)).run();
    });
  }
}

export function createSqliteEvacuationShelterRepository(
  db: EvacuationDatabase,
): EvacuationShelterRepository {
  return new SqliteEvacuationShelterRepository(db);
}
