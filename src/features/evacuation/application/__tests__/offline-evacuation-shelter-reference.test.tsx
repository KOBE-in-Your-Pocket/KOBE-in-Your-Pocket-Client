import Database from 'better-sqlite3';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { renderHook, waitFor } from '@testing-library/react-native';
import path from 'path';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';
import type { ShelterDataset } from '../../domain/shelter-dataset-metadata';
import { useEvacuationShelterDetail } from '../hooks/use-evacuation-shelter-detail';
import { useEvacuationShelters } from '../hooks/use-evacuation-shelters';
import { resetEvacuationDatabaseBootstrapForTests } from '../use-cases/bootstrap-evacuation-database';
import {
  getEvacuationShelterByIdFromLocalDb,
  getEvacuationSheltersFromLocalDb,
} from '../use-cases/local-evacuation-shelter-queries';

import { fetchEvacuationShelterDataset } from '../../infrastructure/api/shelter-api';
import type { EvacuationDatabase } from '../../infrastructure/db/client';
import { getEvacuationDatabase } from '../../infrastructure/db/client';
import * as schema from '../../infrastructure/db/schema';
import { createSqliteEvacuationShelterRepository } from '../../infrastructure/db/sqlite-evacuation-shelter-repository';
import {
  getLastSeededShelterLanguage,
  setLastSeededShelterLanguage,
} from '../../infrastructure/storage/shelter-language-storage';

import type { SupportedLanguage } from '@/shared/lib/i18n';
import type { ReactNode } from 'react';

let mockLanguage: SupportedLanguage = 'ja';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: mockLanguage } }),
}));

jest.mock('../../infrastructure/api/shelter-api', () => ({
  fetchEvacuationShelterDataset: jest.fn(),
}));

jest.mock('../../infrastructure/storage/shelter-language-storage', () => ({
  getLastSeededShelterLanguage: jest.fn(),
  setLastSeededShelterLanguage: jest.fn(),
}));

jest.mock('../../infrastructure/storage/shelter-dataset-metadata-storage', () => ({
  setShelterDatasetMetadata: jest.fn(),
}));

jest.mock('../../infrastructure/db/client', () => {
  const actual = jest.requireActual<typeof import('../../infrastructure/db/client')>(
    '../../infrastructure/db/client',
  );

  return {
    ...actual,
    getEvacuationDatabase: jest.fn(),
  };
});

jest.mock('../../infrastructure/db/run-migrations', () => ({
  runEvacuationMigrations: jest.fn().mockResolvedValue(undefined),
}));

const seededShelters: EvacuationShelter[] = [
  {
    id: 'shelter-1',
    name: '避難所A',
    address: '住所A',
    coordinates: { latitude: 34.69, longitude: 135.19 },
    type: 'emergency',
    facilityCategory: 'park',
    media: { imageUrl: 'https://example.com/a.jpg' },
    capacity: 100,
    accessible: true,
  },
  {
    id: 'shelter-2',
    name: '避難所B',
    address: '住所B',
    coordinates: { latitude: 34.67, longitude: 135.16 },
    type: 'designated',
    facilityCategory: 'school',
    media: { imageUrl: 'https://example.com/b.jpg' },
    accessible: false,
  },
];

const seededSheltersEn: EvacuationShelter[] = [
  {
    id: 'shelter-1',
    name: 'Shelter A',
    address: 'Address A',
    coordinates: { latitude: 34.69, longitude: 135.19 },
    type: 'emergency',
    facilityCategory: 'park',
    media: { imageUrl: 'https://example.com/a.jpg' },
    capacity: 100,
    accessible: true,
  },
];

/** 避難所一覧を API のデータセット封筒に包む。出典メタデータはこのテストの関心外。 */
function datasetOf(shelters: EvacuationShelter[]): ShelterDataset<EvacuationShelter> {
  return { shelters, metadata: null };
}

function createInMemoryEvacuationDatabase(): {
  db: EvacuationDatabase;
  close: () => void;
} {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.resolve(__dirname, '../../../../../drizzle') });

  return {
    db: db as unknown as EvacuationDatabase,
    close: () => sqlite.close(),
  };
}

function createQueryClientWrapper(queryClient: QueryClient) {
  function QueryClientWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return QueryClientWrapper;
}

describe('オフライン（DBのみ）避難所参照', () => {
  let closeDatabase: (() => void) | undefined;

  beforeEach(() => {
    resetEvacuationDatabaseBootstrapForTests();
    jest.clearAllMocks();

    mockLanguage = 'ja';
    jest.mocked(getLastSeededShelterLanguage).mockResolvedValue(null);
    jest.mocked(setLastSeededShelterLanguage).mockResolvedValue(undefined);

    const { db, close } = createInMemoryEvacuationDatabase();
    closeDatabase = close;
    jest.mocked(getEvacuationDatabase).mockReturnValue(db);
  });

  afterEach(() => {
    closeDatabase?.();
    closeDatabase = undefined;
  });

  describe('local-evacuation-shelter-queries', () => {
    it('DB にデータがあり同じ言語のときは fetch せず一覧を返す', async () => {
      const repository = createSqliteEvacuationShelterRepository(getEvacuationDatabase());
      await repository.replaceAll(seededShelters);
      jest.mocked(getLastSeededShelterLanguage).mockResolvedValue('ja');

      await expect(getEvacuationSheltersFromLocalDb('ja')).resolves.toEqual(seededShelters);
      expect(fetchEvacuationShelterDataset).not.toHaveBeenCalled();
    });

    it('DB にデータがあり同じ言語のときは fetch せず詳細を返す', async () => {
      const repository = createSqliteEvacuationShelterRepository(getEvacuationDatabase());
      await repository.replaceAll(seededShelters);
      jest.mocked(getLastSeededShelterLanguage).mockResolvedValue('ja');

      await expect(getEvacuationShelterByIdFromLocalDb('shelter-2', 'ja')).resolves.toEqual(
        seededShelters[1],
      );
      expect(fetchEvacuationShelterDataset).not.toHaveBeenCalled();
    });

    it('存在しない ID は null を返す', async () => {
      const repository = createSqliteEvacuationShelterRepository(getEvacuationDatabase());
      await repository.replaceAll(seededShelters);
      jest.mocked(getLastSeededShelterLanguage).mockResolvedValue('ja');

      await expect(getEvacuationShelterByIdFromLocalDb('missing', 'ja')).resolves.toBeNull();
      expect(fetchEvacuationShelterDataset).not.toHaveBeenCalled();
    });

    it('DB が空のときのみ初回 bootstrap で fetch してシードする', async () => {
      jest.mocked(fetchEvacuationShelterDataset).mockResolvedValue(datasetOf(seededShelters));

      await expect(getEvacuationSheltersFromLocalDb('ja')).resolves.toEqual(seededShelters);
      expect(fetchEvacuationShelterDataset).toHaveBeenCalledTimes(1);

      jest.mocked(getLastSeededShelterLanguage).mockResolvedValue('ja');
      await expect(getEvacuationSheltersFromLocalDb('ja')).resolves.toEqual(seededShelters);
      expect(fetchEvacuationShelterDataset).toHaveBeenCalledTimes(1);
    });

    it('表示言語が変わると再取得して新しい言語のデータに入れ替える', async () => {
      jest.mocked(fetchEvacuationShelterDataset).mockResolvedValueOnce(datasetOf(seededShelters));
      await expect(getEvacuationSheltersFromLocalDb('ja')).resolves.toEqual(seededShelters);
      expect(fetchEvacuationShelterDataset).toHaveBeenCalledWith('ja');

      jest.mocked(getLastSeededShelterLanguage).mockResolvedValue('ja');
      jest.mocked(fetchEvacuationShelterDataset).mockResolvedValueOnce(datasetOf(seededSheltersEn));

      await expect(getEvacuationSheltersFromLocalDb('en')).resolves.toEqual(seededSheltersEn);
      expect(fetchEvacuationShelterDataset).toHaveBeenCalledTimes(2);
      expect(fetchEvacuationShelterDataset).toHaveBeenLastCalledWith('en');
    });
  });

  describe('useEvacuationShelters / useEvacuationShelterDetail', () => {
    let queryClient: QueryClient;

    beforeEach(async () => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
        },
      });

      const repository = createSqliteEvacuationShelterRepository(getEvacuationDatabase());
      await repository.replaceAll(seededShelters);
      jest.mocked(getLastSeededShelterLanguage).mockResolvedValue('ja');
    });

    afterEach(async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
    });

    it('useEvacuationShelters は hook 経由で DB から一覧を取得する', async () => {
      const { result, unmount } = renderHook(() => useEvacuationShelters(), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(seededShelters);
      expect(fetchEvacuationShelterDataset).not.toHaveBeenCalled();
      unmount();
    });

    it('useEvacuationShelterDetail は hook 経由で DB から詳細を取得する', async () => {
      const { result, unmount } = renderHook(() => useEvacuationShelterDetail('shelter-1'), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(seededShelters[0]);
      expect(fetchEvacuationShelterDataset).not.toHaveBeenCalled();
      unmount();
    });

    it('shelterId 未指定時は詳細 hook がクエリを実行しない', () => {
      const { result, unmount } = renderHook(() => useEvacuationShelterDetail(null), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.data).toBeUndefined();
      expect(fetchEvacuationShelterDataset).not.toHaveBeenCalled();
      unmount();
    });

    it('表示言語が変わると新しいクエリキーで再取得し、新しい言語のデータを返す', async () => {
      const { result, rerender, unmount } = renderHook(() => useEvacuationShelters(), {
        wrapper: createQueryClientWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(seededShelters);

      jest.mocked(fetchEvacuationShelterDataset).mockResolvedValueOnce(datasetOf(seededSheltersEn));
      mockLanguage = 'en';
      rerender({});

      await waitFor(() => {
        expect(result.current.data).toEqual(seededSheltersEn);
      });
      expect(fetchEvacuationShelterDataset).toHaveBeenCalledWith('en');
      unmount();
    });
  });
});
