import type { EvacuationShelter } from '../../domain/evacuation-shelter';

import type { EvacuationShelterRecord, NewEvacuationShelterRecord } from './schema';

export function toEvacuationShelter(record: EvacuationShelterRecord): EvacuationShelter {
  return {
    id: record.id,
    name: record.name,
    address: record.address,
    coordinates: {
      latitude: record.latitude,
      longitude: record.longitude,
    },
    type: record.type,
    facilityCategory: record.facilityCategory,
    media: { imageUrl: record.imageUrl },
    capacity: record.capacity ?? undefined,
    accessible: record.accessible,
    externalUrl: record.externalUrl ?? undefined,
  };
}

export function toEvacuationShelterRecord(shelter: EvacuationShelter): NewEvacuationShelterRecord {
  return {
    id: shelter.id,
    name: shelter.name,
    address: shelter.address,
    latitude: shelter.coordinates.latitude,
    longitude: shelter.coordinates.longitude,
    type: shelter.type,
    facilityCategory: shelter.facilityCategory,
    imageUrl: shelter.media.imageUrl,
    capacity: shelter.capacity ?? null,
    accessible: shelter.accessible,
    externalUrl: shelter.externalUrl ?? null,
  };
}
