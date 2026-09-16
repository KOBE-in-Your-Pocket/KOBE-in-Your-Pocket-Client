import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';
import type { EvacuationShelterRepository } from '../../domain/evacuation-shelter-repository';
import { getEvacuationDatabase } from '../../infrastructure/db/client';
import { createSqliteEvacuationShelterRepository } from '../../infrastructure/db/sqlite-evacuation-shelter-repository';

import { bootstrapEvacuationDatabase } from './bootstrap-evacuation-database';

async function withEvacuationShelterRepository(
  language: SupportedLanguage,
): Promise<EvacuationShelterRepository> {
  await bootstrapEvacuationDatabase(language);
  return createSqliteEvacuationShelterRepository(getEvacuationDatabase());
}

export async function getEvacuationSheltersFromLocalDb(
  language: SupportedLanguage,
): Promise<EvacuationShelter[]> {
  const repository = await withEvacuationShelterRepository(language);
  return repository.findAll();
}

export async function getEvacuationShelterByIdFromLocalDb(
  id: string,
  language: SupportedLanguage,
): Promise<EvacuationShelter | null> {
  const repository = await withEvacuationShelterRepository(language);
  return repository.findById(id);
}
