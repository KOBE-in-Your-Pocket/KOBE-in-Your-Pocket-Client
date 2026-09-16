import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';

import type { EvacuationShelter } from '../../../domain/evacuation-shelter';

import type { EvacuationDatabase } from '../client';
import { toEvacuationShelterRecord } from '../evacuation-shelter-mapper';
import * as schema from '../schema';
import type { NewEvacuationShelterRecord } from '../schema';
import { createSqliteEvacuationShelterRepository } from '../sqlite-evacuation-shelter-repository';

const sampleShelters: EvacuationShelter[] = [
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
    externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
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

// 作成した in-memory DB を追跡し、テストごとに close してネイティブハンドルのリークを防ぐ。
const openDatabases: Database.Database[] = [];

function createTestRepository() {
  const sqlite = new Database(':memory:');
  openDatabases.push(sqlite);
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.resolve(__dirname, '../../../../../../drizzle') });

  return createSqliteEvacuationShelterRepository(db as unknown as EvacuationDatabase);
}

afterEach(() => {
  while (openDatabases.length > 0) {
    openDatabases.pop()?.close();
  }
});

describe('SqliteEvacuationShelterRepository', () => {
  it('replaceAll で避難所を永続化し findAll で取得できる', async () => {
    const repository = createTestRepository();

    await repository.replaceAll(sampleShelters);

    await expect(repository.findAll()).resolves.toEqual(sampleShelters);
  });

  it('findById で単一の避難所を取得できる', async () => {
    const repository = createTestRepository();
    await repository.replaceAll(sampleShelters);

    await expect(repository.findById('shelter-2')).resolves.toEqual(sampleShelters[1]);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('replaceAll は既存データを置き換える', async () => {
    const repository = createTestRepository();
    await repository.replaceAll(sampleShelters);
    await repository.replaceAll([sampleShelters[0]]);

    await expect(repository.findAll()).resolves.toEqual([sampleShelters[0]]);
  });

  it('replaceAll([]) で全件削除できる', async () => {
    const repository = createTestRepository();
    await repository.replaceAll(sampleShelters);
    await repository.replaceAll([]);

    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('replaceAll の insert が失敗したらエラーを伝播し、既存データを保持する', async () => {
    // 実 SQLite の制約発火に依存すると CI 環境で挙動が揺れるため、insert が確実に throw する
    // fake DB を注入して「delete/insert を 1 トランザクションで実行し、insert 失敗時は
    // ロールバックして既存データを残す」という replaceAll の契約を決定論的に検証する。
    const repository = createSqliteEvacuationShelterRepository(
      createInsertFailingFakeDb(sampleShelters.map(toEvacuationShelterRecord)),
    );

    await expect(repository.replaceAll([sampleShelters[0]])).rejects.toThrow('insert failed');
    await expect(repository.findAll()).resolves.toEqual(sampleShelters);
  });
});

/**
 * insert が必ず失敗する最小限の fake DB。
 * `replaceAll` / `findAll` が使う API（transaction・delete・insert・select().from()）だけを模し、
 * トランザクションのロールバック（コールバックが throw したら store を巻き戻す）を再現する。
 * これにより、実 SQLite の制約・マイグレーション・ハンドル状態に一切依存せず失敗経路を検証できる。
 */
function createInsertFailingFakeDb(seed: NewEvacuationShelterRecord[]): EvacuationDatabase {
  let store: NewEvacuationShelterRecord[] = [...seed];

  const tx = {
    delete: () => ({
      run: () => {
        store = [];
      },
    }),
    insert: () => ({
      values: () => ({
        run: () => {
          throw new Error('insert failed');
        },
      }),
    }),
  };
  type FakeTx = typeof tx;

  const fakeDb = {
    transaction: (fn: (tx: FakeTx) => void) => {
      const snapshot = [...store];
      try {
        fn(tx);
      } catch (error) {
        store = snapshot;
        throw error;
      }
    },
    select: () => ({
      from: () => Promise.resolve([...store]),
    }),
  };

  return fakeDb as unknown as EvacuationDatabase;
}
