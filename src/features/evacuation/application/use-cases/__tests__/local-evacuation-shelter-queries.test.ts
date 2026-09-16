import type { EvacuationShelter } from '../../../domain/evacuation-shelter';
import { getEvacuationDatabase } from '../../../infrastructure/db/client';
import { createSqliteEvacuationShelterRepository } from '../../../infrastructure/db/sqlite-evacuation-shelter-repository';
import { bootstrapEvacuationDatabase } from '../bootstrap-evacuation-database';
import {
  getEvacuationShelterByIdFromLocalDb,
  getEvacuationSheltersFromLocalDb,
} from '../local-evacuation-shelter-queries';

jest.mock('../bootstrap-evacuation-database', () => ({
  bootstrapEvacuationDatabase: jest.fn(),
}));

jest.mock('../../../infrastructure/db/client', () => ({
  getEvacuationDatabase: jest.fn(),
}));

jest.mock('../../../infrastructure/db/sqlite-evacuation-shelter-repository', () => ({
  createSqliteEvacuationShelterRepository: jest.fn(),
}));

const mockShelter: EvacuationShelter = {
  id: 'shelter-1',
  name: '避難所A',
  address: '住所A',
  coordinates: { latitude: 34.69, longitude: 135.19 },
  type: 'emergency',
  facilityCategory: 'park',
  media: { imageUrl: 'https://example.com/a.jpg' },
  accessible: true,
};

describe('local-evacuation-shelter-queries', () => {
  const findAll = jest.fn();
  const findById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(bootstrapEvacuationDatabase).mockResolvedValue(undefined);
    jest.mocked(getEvacuationDatabase).mockReturnValue({} as never);
    jest.mocked(createSqliteEvacuationShelterRepository).mockReturnValue({
      findAll,
      findById,
      replaceAll: jest.fn(),
    });
  });

  it('getEvacuationSheltersFromLocalDb は指定言語で bootstrap 後に findAll する', async () => {
    findAll.mockResolvedValue([mockShelter]);

    await expect(getEvacuationSheltersFromLocalDb('ja')).resolves.toEqual([mockShelter]);

    expect(bootstrapEvacuationDatabase).toHaveBeenCalledWith('ja');
    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it('getEvacuationShelterByIdFromLocalDb は指定言語で bootstrap 後に findById する', async () => {
    findById.mockResolvedValue(mockShelter);

    await expect(getEvacuationShelterByIdFromLocalDb('shelter-1', 'ja')).resolves.toEqual(
      mockShelter,
    );

    expect(bootstrapEvacuationDatabase).toHaveBeenCalledWith('ja');
    expect(findById).toHaveBeenCalledWith('shelter-1');
  });
});
