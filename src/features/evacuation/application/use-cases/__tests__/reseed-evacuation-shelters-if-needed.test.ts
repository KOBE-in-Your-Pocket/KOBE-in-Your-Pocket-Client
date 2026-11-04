import type { EvacuationShelter } from '../../../domain/evacuation-shelter';
import type { EvacuationShelterRepository } from '../../../domain/evacuation-shelter-repository';
import type { ShelterDatasetMetadata } from '../../../domain/shelter-dataset-metadata';
import {
  readShelterReseedState,
  reseedEvacuationSheltersIfNeeded,
} from '../reseed-evacuation-shelters-if-needed';

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

const NOW = Date.UTC(2026, 0, 2);
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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
    seedVersion: 1,
    getLastSeededVersion: jest.fn().mockResolvedValue(1),
    setLastSeededVersion: jest.fn().mockResolvedValue(undefined),
    getDatasetMetadata: jest.fn().mockResolvedValue(null),
    setDatasetMetadata: jest.fn().mockResolvedValue(undefined),
    now: jest.fn().mockReturnValue(NOW),
    getLastFetchedAt: jest.fn().mockResolvedValue(NOW - HOUR_MS),
    setLastFetchedAt: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('readShelterReseedState', () => {
  const seeded = {
    repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
    getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
  };

  it('言語・シード版が同じで 24 時間未満なら none', async () => {
    await expect(readShelterReseedState(createDeps(seeded))).resolves.toMatchObject({
      timing: 'none',
    });
  });

  it('24 時間経過だけなら background（保存済みのデータをそのまま表示できる）', async () => {
    const deps = createDeps({
      ...seeded,
      getLastFetchedAt: jest.fn().mockResolvedValue(NOW - DAY_MS),
    });

    await expect(readShelterReseedState(deps)).resolves.toMatchObject({ timing: 'background' });
  });

  it.each([
    ['DB が空', { repository: createRepository() }],
    ['言語が異なる', { getLastSeededLanguage: jest.fn().mockResolvedValue('en') }],
    ['シード版が古い', { getLastSeededVersion: jest.fn().mockResolvedValue(0) }],
  ])('%s ときは 24 時間経過していても blocking', async (_label, overrides) => {
    const deps = createDeps({
      ...seeded,
      getLastFetchedAt: jest.fn().mockResolvedValue(NOW - DAY_MS),
      ...overrides,
    });

    await expect(readShelterReseedState(deps)).resolves.toMatchObject({ timing: 'blocking' });
  });
});

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
    expect(deps.setLastSeededVersion).toHaveBeenCalledWith(1);
    expect(deps.setLastFetchedAt).toHaveBeenCalledWith(NOW);
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

  it('DB にデータがあり、最後にシードした言語とシード版が同じときは取得せず投入しない', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
      getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
      language: 'ja',
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

    expect(deps.fetchDataset).not.toHaveBeenCalled();
    expect(deps.repository.replaceAll).not.toHaveBeenCalled();
    expect(deps.setLastSeededLanguage).not.toHaveBeenCalled();
    expect(deps.setLastSeededVersion).not.toHaveBeenCalled();
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

  it.each([
    ['記録が無い（シード版を記録する前のバージョンでシードした端末）', null],
    ['古い', 0],
  ])(
    'DB にデータがあり言語が同じでも、シード版が%sときは取得し直す',
    async (_label, lastSeededVersion) => {
      const deps = createDeps({
        repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
        getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
        getLastSeededVersion: jest.fn().mockResolvedValue(lastSeededVersion),
        language: 'ja',
      });

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

      expect(deps.fetchDataset).toHaveBeenCalledWith('ja');
      expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
      expect(deps.setLastSeededVersion).toHaveBeenCalledWith(1);
    },
  );

  it('シード版が古く取得にも失敗したときは、既存データを残してシード版を記録しない（次回起動で再試行）', async () => {
    const deps = createDeps({
      repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
      fetchDataset: jest.fn().mockRejectedValue(new Error('network error')),
      getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
      getLastSeededVersion: jest.fn().mockResolvedValue(null),
      language: 'ja',
    });

    await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

    expect(deps.repository.replaceAll).not.toHaveBeenCalled();
    expect(deps.setLastSeededVersion).not.toHaveBeenCalled();
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

  describe('前回の取得からの経過時間（#692）', () => {
    function createFreshDeps(
      lastFetchedAt: number | null,
      overrides: Partial<Parameters<typeof reseedEvacuationSheltersIfNeeded>[0]> = {},
    ) {
      return createDeps({
        repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
        getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
        getLastFetchedAt: jest.fn().mockResolvedValue(lastFetchedAt),
        ...overrides,
      });
    }

    it.each([
      ['ちょうど 24 時間', NOW - DAY_MS],
      ['24 時間超', NOW - DAY_MS - HOUR_MS],
      ['記録なし（日時を記録する前のバージョンで取得した端末）', null],
      ['未来の日時（端末の時計が戻された）', NOW + HOUR_MS],
    ])('%s のときは言語・シード版が同じでも取り直す', async (_label, lastFetchedAt) => {
      const deps = createFreshDeps(lastFetchedAt);

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

      expect(deps.fetchDataset).toHaveBeenCalledWith('ja');
      expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
      expect(deps.setLastFetchedAt).toHaveBeenCalledWith(NOW);
    });

    it('24 時間未満のときは取り直さず、取得日時も更新しない', async () => {
      const deps = createFreshDeps(NOW - DAY_MS + 1);

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

      expect(deps.fetchDataset).not.toHaveBeenCalled();
      expect(deps.repository.replaceAll).not.toHaveBeenCalled();
      expect(deps.setLastFetchedAt).not.toHaveBeenCalled();
    });

    it('24 時間経過していても取得に失敗したら、既存データを残して取得日時を更新しない', async () => {
      const deps = createFreshDeps(NOW - DAY_MS, {
        fetchDataset: jest.fn().mockRejectedValue(new Error('network error')),
      });

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

      expect(deps.repository.replaceAll).not.toHaveBeenCalled();
      expect(deps.setLastFetchedAt).not.toHaveBeenCalled();
    });

    it('SQLite への投入に失敗したら取得日時を更新しない', async () => {
      const deps = createFreshDeps(NOW - DAY_MS, {
        repository: createRepository({
          findAll: jest.fn().mockResolvedValue(mockShelters),
          replaceAll: jest.fn().mockRejectedValue(new Error('db error')),
        }),
      });

      await expect(reseedEvacuationSheltersIfNeeded(deps)).rejects.toThrow('db error');

      expect(deps.setLastFetchedAt).not.toHaveBeenCalled();
    });
  });

  describe('backend の meta.updatedAt との比較（#693）', () => {
    const STORED_UPDATED_AT = '2026-09-29T15:13:20.984244Z';

    function metadataAt(updatedAt: string): ShelterDatasetMetadata {
      return { ...mockMetadata, updatedAt };
    }

    /** 24 時間経過だけが理由の取り直し（background）になる端末。 */
    function createDueDeps(
      fetchedMetadata: ShelterDatasetMetadata | null,
      storedMetadata: ShelterDatasetMetadata | null = metadataAt(STORED_UPDATED_AT),
      overrides: Partial<Parameters<typeof reseedEvacuationSheltersIfNeeded>[0]> = {},
    ) {
      return createDeps({
        repository: createRepository({ findAll: jest.fn().mockResolvedValue(mockShelters) }),
        getLastSeededLanguage: jest.fn().mockResolvedValue('ja'),
        getLastFetchedAt: jest.fn().mockResolvedValue(NOW - DAY_MS),
        fetchDataset: jest
          .fn()
          .mockResolvedValue({ shelters: mockShelters, metadata: fetchedMetadata }),
        getDatasetMetadata: jest.fn().mockResolvedValue(storedMetadata),
        ...overrides,
      });
    }

    it.each([
      ['1 マイクロ秒だけ新しい', '2026-09-29T15:13:20.984245Z'],
      ['1 日新しい', '2026-09-30T15:13:20.984244Z'],
      ['小数部なしの表記で新しい', '2026-09-29T15:13:21Z'],
    ])(
      'updatedAt が端末の値より新しい（%s）ときは取り直して保存する',
      async (_label, updatedAt) => {
        const fetched = metadataAt(updatedAt);
        const deps = createDueDeps(fetched);

        await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

        expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
        expect(deps.setDatasetMetadata).toHaveBeenCalledWith(fetched);
        expect(deps.setLastFetchedAt).toHaveBeenCalledWith(NOW);
      },
    );

    it.each([
      ['端末の値と同じ', STORED_UPDATED_AT],
      ['同じ時刻を別のタイムゾーンで表記した', '2026-09-30T00:13:20.984244+09:00'],
      ['端末の値より古い', '2026-09-28T15:13:20.984244Z'],
    ])(
      'updatedAt が%s場合は DB を書き換えず、次の確認を 24 時間後にする',
      async (_label, updatedAt) => {
        const deps = createDueDeps(metadataAt(updatedAt));

        await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

        expect(deps.repository.replaceAll).not.toHaveBeenCalled();
        expect(deps.setDatasetMetadata).not.toHaveBeenCalled();
        expect(deps.setLastSeededLanguage).not.toHaveBeenCalled();
        expect(deps.setLastFetchedAt).toHaveBeenCalledWith(NOW);
      },
    );

    it.each([
      ['meta が返らない', null],
      ['updatedAt が解析できない', metadataAt('not-a-date')],
      ['updatedAt にタイムゾーンが無い', metadataAt('2026-09-30T15:13:20')],
    ])('%s場合（取得した updatedAt で比べられない）は既存データを残す', async (_label, fetched) => {
      const deps = createDueDeps(fetched);

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

      expect(deps.repository.replaceAll).not.toHaveBeenCalled();
      expect(deps.setDatasetMetadata).not.toHaveBeenCalled();
    });

    it('取得に失敗したときは既存データを残し、比較もしない', async () => {
      const deps = createDueDeps(metadataAt('2026-09-30T00:00:00Z'), undefined, {
        fetchDataset: jest.fn().mockRejectedValue(new Error('network error')),
      });

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(false);

      expect(deps.getDatasetMetadata).not.toHaveBeenCalled();
      expect(deps.repository.replaceAll).not.toHaveBeenCalled();
      expect(deps.setLastFetchedAt).not.toHaveBeenCalled();
    });

    it.each([
      ['端末に updatedAt が保存されていない', null],
      ['端末に保存済みの updatedAt が解析できない', metadataAt('broken')],
    ])('%sときは、比べられないので取り直す', async (_label, stored) => {
      const deps = createDueDeps(metadataAt(STORED_UPDATED_AT), stored);

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

      expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
    });

    it('言語が異なるとき（blocking）は updatedAt が同じでも取り直す', async () => {
      const deps = createDueDeps(metadataAt(STORED_UPDATED_AT), undefined, {
        getLastSeededLanguage: jest.fn().mockResolvedValue('en'),
      });

      await expect(reseedEvacuationSheltersIfNeeded(deps)).resolves.toBe(true);

      expect(deps.repository.replaceAll).toHaveBeenCalledWith(mockShelters);
      expect(deps.setLastSeededLanguage).toHaveBeenCalledWith('ja');
    });
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
