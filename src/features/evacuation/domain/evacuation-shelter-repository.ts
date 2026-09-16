import type { EvacuationShelter } from './evacuation-shelter';

export type EvacuationShelterRepository = {
  findAll(): Promise<EvacuationShelter[]>;
  findById(id: string): Promise<EvacuationShelter | null>;
  replaceAll(shelters: EvacuationShelter[]): Promise<void>;
};
