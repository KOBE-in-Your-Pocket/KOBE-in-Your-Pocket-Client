import { filterSheltersByDisaster } from '../filter-shelters-by-disaster';

import type {
  EvacuationShelter,
  ShelterSuitabilityByDisaster,
} from '../../../domain/evacuation-shelter';

const makeShelter = (
  id: string,
  suitability?: ShelterSuitabilityByDisaster,
): EvacuationShelter => ({
  id,
  name: id,
  address: '',
  coordinates: { latitude: 34.7, longitude: 135.2 },
  type: 'designated',
  facilityCategory: 'school',
  media: { imageUrl: '' },
  accessible: false,
  ...(suitability ? { suitability } : {}),
});

const FLOOD_ONLY = makeShelter('flood-only', {
  landslide: 'unsuitable',
  flood: 'suitable',
  tsunami: 'unsuitable',
  'large-fire': 'not-applicable',
});
const TSUNAMI_ONLY = makeShelter('tsunami-only', {
  landslide: 'unsuitable',
  flood: 'unsuitable',
  tsunami: 'suitable',
  'large-fire': 'not-applicable',
});
const FLOOD_CONDITIONAL = makeShelter('flood-conditional', {
  landslide: 'unsuitable',
  flood: 'conditional',
  tsunami: 'unsuitable',
  'large-fire': 'not-applicable',
});
const NO_DATA = makeShelter('no-data');

const SHELTERS = [FLOOD_ONLY, TSUNAMI_ONLY, FLOOD_CONDITIONAL, NO_DATA];

const idsOf = (shelters: EvacuationShelter[]) => shelters.map((shelter) => shelter.id);

describe('filterSheltersByDisaster', () => {
  it('災害種別を 1 つも選んでいないときは全件を同じ配列参照で返す', () => {
    expect(filterSheltersByDisaster(SHELTERS, [])).toBe(SHELTERS);
  });

  it('1 つ選ぶと、その災害が suitable の避難所だけを返す', () => {
    expect(idsOf(filterSheltersByDisaster(SHELTERS, ['flood']))).toEqual(['flood-only']);
  });

  it('conditional（条件付き）の避難所は含めない', () => {
    expect(idsOf(filterSheltersByDisaster(SHELTERS, ['flood']))).not.toContain('flood-conditional');
  });

  it.each(['unsuitable', 'not-applicable'] as const)('%s の避難所は含めない', (value) => {
    const shelter = makeShelter('target', { flood: value });

    expect(filterSheltersByDisaster([shelter], ['flood'])).toHaveLength(0);
  });

  it('複数選ぶと、いずれかの災害で suitable の避難所を返す（OR）', () => {
    expect(idsOf(filterSheltersByDisaster(SHELTERS, ['flood', 'tsunami']))).toEqual([
      'flood-only',
      'tsunami-only',
    ]);
  });

  it('適否の情報が無い避難所は、絞り込み時は含めない', () => {
    expect(idsOf(filterSheltersByDisaster(SHELTERS, ['flood', 'tsunami']))).not.toContain(
      'no-data',
    );
  });

  it('元の並び順を保つ', () => {
    expect(
      idsOf(filterSheltersByDisaster([TSUNAMI_ONLY, FLOOD_ONLY], ['flood', 'tsunami'])),
    ).toEqual(['tsunami-only', 'flood-only']);
  });

  it('該当する避難所が無い場合は空配列を返す', () => {
    expect(filterSheltersByDisaster(SHELTERS, ['large-fire'])).toHaveLength(0);
  });
});
