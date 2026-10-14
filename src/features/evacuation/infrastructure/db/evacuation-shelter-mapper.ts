import type {
  EvacuationShelter,
  ShelterSuitabilityByDisaster,
} from '../../domain/evacuation-shelter';

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
    phoneNumber: record.phoneNumber ?? undefined,
    suitability: toSuitabilityByDisaster(record),
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
    phoneNumber: shelter.phoneNumber ?? null,
    suitabilityLandslide: shelter.suitability?.landslide ?? null,
    suitabilityFlood: shelter.suitability?.flood ?? null,
    suitabilityTsunami: shelter.suitability?.tsunami ?? null,
    suitabilityLargeFire: shelter.suitability?.['large-fire'] ?? null,
  };
}

/** 適否の 4 列をドメインの形へ戻す。NULL の列はキーを持たせず、全列 NULL なら undefined にする。 */
function toSuitabilityByDisaster(
  record: EvacuationShelterRecord,
): ShelterSuitabilityByDisaster | undefined {
  const suitability: ShelterSuitabilityByDisaster = {};
  if (record.suitabilityLandslide !== null) suitability.landslide = record.suitabilityLandslide;
  if (record.suitabilityFlood !== null) suitability.flood = record.suitabilityFlood;
  if (record.suitabilityTsunami !== null) suitability.tsunami = record.suitabilityTsunami;
  if (record.suitabilityLargeFire !== null) {
    suitability['large-fire'] = record.suitabilityLargeFire;
  }

  return Object.keys(suitability).length > 0 ? suitability : undefined;
}
