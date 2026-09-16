import type { EvacuationShelter } from '../../../domain/evacuation-shelter';
import type { EvacuationShelterRepository } from '../../../domain/evacuation-shelter-repository';
import type { ShelterDatasetMetadata } from '../../../domain/shelter-dataset-metadata';
import { reseedEvacuationSheltersIfNeeded } from '../reseed-evacuation-shelters-if-needed';

const mockShelters: EvacuationShelter[] = [
  {
    id: 'shelter-1',
    name: '避難所A',
    address: '住所A',
    coordinates: { latitude: 34.69, longitude: 135.19 },
    type: 'emergency',
    facilityCategory: 'park',
    media: { imageUrl: 'https://example.com/a.jpg' },
    accessible: true,
  },
];

const mockMetadata: ShelterDatasetMetadata = {
  source: '神戸市オープンデータ',
  asOf: '2025-04-02',
  updatedAt: '2025-04-02T00:00:00Z',
};

function createRepository(
  overrides: Partial<EvacuationShelterRepository> = {},
): EvacuationShelterRepository {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    replaceAll: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createDeps(
  overrides: Partial<Parameters<typeof reseedEvacuationSheltersIfNeeded>[0]> = {},
) {
  return {
    repository: createRepository(),
    fetchDataset: jest.fn().mockResolvedValue({ shelters: mockShelters, metadata: mockMetadata }),
    language: 'ja' as const,
    getLastSeededLanguage: jest.fn().mockResolvedValue(null),
    setLastSeededLanguage: jest.fn().mockResolvedValue(undefined),
    setDatasetMetadata: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('reseedEvacuationSheltersIfNeeded', () => {
  it('DB が空のとき取得して投入する', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue([]) }),
      getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

    expect(deps.fetchDataset).toHaveBeenCalledWith('ja');
    expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
    expect(deps.setLastSeededLanguage).toHaveBeenCalledWith('ja');
    expect(deps.setDatasetMetadata).toHaveBeenCalledWith(mockMetadata);
  });

  it('meta を返さないレスポンスでも投入は成功し、保存済みの出典を上書きしない', async () => {
    const deps = createDeps({
      fetchDataset: jest.fn().mockResolvedValue({ shelters: mockShelters, metadata: null }),
      getLastSeededLanguage: jest.fn().mockResolvedValue(null),
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

    expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
    expect(deps.setDatasetMetadata).not.toHaveBeenCalled();
  });

  it('DB にデータがあり、最後にシードした言語が同じときは取得せず投入しない', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
      getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
      language: 'ja',
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

    expect(deps.fetchDataset).not.toHaveBeenCalled();
    expect(deps.repository.replaceAll).not.toHaveBeenCalled();
    expect(deps.setLastSeededLanguage).not.toHaveBeenCalled();
  });

  it('DB にデータがあっても、最後にシードした言語が異なるときは新しい言語で取得し直す', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
      getLastSeededLanguage: jest.fn().mockResolvedValue('en'),
      language: 'ja',
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

    expect(deps.fetchDataset).toHaveBeenCalledWith('ja');
    expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
    expect(deps.setLastSeededLanguage).toHaveBeenCalledWith('ja');
  });

  it('最後にシードした言語の記録が無いとき（ドリフト）は DB にデータがあっても取得し直す', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
      getLastSeededLanguage: jest.fn().mockResolvedValue(null),
      language: 'ja',
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

    expect(deps.fetchDataset).toHaveBeenCalledWith('ja');
    expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
  });

  it('取得に失敗しても DB に既存データがあれば例外を投げず false を返す（オフラインでの言語切替）', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
      fetchDataset: jest.fn().mockRejectedValue(new Error('network error')),
      getLastSeededLanguage: jest.fn().mockResolvedValue('en'),
      language: 'ja',
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

    expect(deps.repository.replaceAll).not.toHaveBeenCalled();
    expect(deps.setLastSeededLanguage).not.toHaveBeenCalled();
  });

  it('取得に失敗し DB も空のときは例外をそのまま伝播する（表示できるデータが無い）', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue([]) }),
      fetchDataset: jest.fn().mockRejectedValue(new Error('network error')),
      getLastSeededLanguage: jest.fn().mockResolvedValue(null),
      language: 'ja',
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).rejects.toThrow('network error');

    expect(deps.repository.replaceAll).not.toHaveBeenCalled();
    expect(deps.setLastSeededLanguage).not.toHaveBeenCalled();
  });
});
