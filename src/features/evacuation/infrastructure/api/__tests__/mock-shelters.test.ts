import { fetchEvacuationShelters } from '../mock-shelters';

describe('fetchEvacuationShelters', () => {
  it('5件以上の避難所を返す', async () => {
    const shelters = await fetchEvacuationShelters();

    expect(shelters.length).toBeGreaterThanOrEqual(5);
  });

  it('各避難所は一覧表示に必要なフィールドを持つ', async () => {
    const shelters = await fetchEvacuationShelters();

    for (const shelter of shelters) {
      expect(shelter.id).toBeTruthy();
      expect(shelter.name).toBeTruthy();
      expect(shelter.address).toBeTruthy();
      expect(shelter.coordinates.latitude).toBeDefined();
      expect(shelter.coordinates.longitude).toBeDefined();
      expect(shelter.type).toBeTruthy();
      expect(shelter.facilityCategory).toBeTruthy();
      expect(shelter.media.imageUrl).toMatch(/^https?:\/\//);
      expect(typeof shelter.accessible).toBe('boolean');
      if (shelter.capacity !== undefined) {
        expect(shelter.capacity).toBeGreaterThan(0);
      }
    }
  });

  it('id は重複しない', async () => {
    const shelters = await fetchEvacuationShelters();

    const ids = shelters.map((shelter) => shelter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('返却オブジェクトは複製で、変更しても次回取得に影響しない', async () => {
    const first = await fetchEvacuationShelters();
    first[0].coordinates.latitude = 0;

    const second = await fetchEvacuationShelters();
    expect(second[0].coordinates.latitude).not.toBe(0);
  });
});
