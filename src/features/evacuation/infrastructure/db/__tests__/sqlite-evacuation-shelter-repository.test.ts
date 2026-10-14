import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import os from 'os';
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
    phoneNumber: '078-411-0556',
    suitability: {
      landslide: 'suitable',
      flood: 'conditional',
      tsunami: 'unsuitable',
      'large-fire': 'not-applicable',
    },
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

const MIGRATIONS_FOLDER = path.resolve(__dirname, '../../../../../../drizzle');

// 作成した in-memory DB を追跡し、テストごとに close してネイティブハンドルのリークを防ぐ。
const openDatabases: Database.Database[] = [];
const temporaryFolders: string[] = [];

function createTestRepository() {
  const sqlite = new Database(':memory:');
  openDatabases.push(sqlite);
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  return createSqliteEvacuationShelterRepository(db as unknown as EvacuationDatabase);
}

/** 先頭 `count` 件のマイグレーションだけを持つフォルダを作る（旧バージョンの DB を再現する用）。 */
function createMigrationsFolderUpTo(count: number): string {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'evacuation-migrations-'));
  temporaryFolders.push(folder);

  const journal = JSON.parse(
    fs.readFileSync(path.join(MIGRATIONS_FOLDER, 'meta/_journal.json'), 'utf8'),
  ) as { entries: { tag: string }[] };
  const entries = journal.entries.slice(0, count);

  fs.mkdirSync(path.join(folder, 'meta'));
  fs.writeFileSync(
    path.join(folder, 'meta/_journal.json'),
    JSON.stringify({ ...journal, entries }),
  );
  for (const { tag } of entries) {
    fs.copyFileSync(path.join(MIGRATIONS_FOLDER, `${tag}.sql`), path.join(folder, `${tag}.sql`));
  }

  return folder;
}

afterEach(() => {
  while (openDatabases.length > 0) {
    openDatabases.pop()?.close();
  }
  while (temporaryFolders.length > 0) {
    fs.rmSync(temporaryFolders.pop() as string, { recursive: true, force: true });
  }
});

describe('SqliteEvacuationShelterRepository', () => {
  it('replaceAll で避難所を永続化し findAll で取得できる', async () => {
    const repository = createTestRepository();

    await repository.replaceAll(sampleShelters);

    await expect(repository.findAll()).resolves.toEqual(sampleShelters);
  });

  it('電話番号を保存→取得で往復し、未登録は phoneNumber を持たない', async () => {
    const repository = createTestRepository();

    await repository.replaceAll(sampleShelters);

    const [withPhoneNumber, withoutPhoneNumber] = await Promise.all([
      repository.findById('shelter-1'),
      repository.findById('shelter-2'),
    ]);
    expect(withPhoneNumber?.phoneNumber).toBe('078-411-0556');
    expect(withoutPhoneNumber?.phoneNumber).toBeUndefined();
  });

  it('phone_number 列を追加するマイグレーションで既存レコードが壊れない', async () => {
    const sqlite = new Database(':memory:');
    openDatabases.push(sqlite);
    const db = drizzle(sqlite, { schema });

    // phone_number 列が無い時点（0001 まで）の DB に 1 件保存しておく。
    migrate(db, { migrationsFolder: createMigrationsFolderUpTo(2) });
    sqlite
      .prepare(
        `INSERT INTO evacuation_shelters
          (id, name, address, latitude, longitude, type, facility_category, image_url, capacity, accessible, external_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'shelter-1',
        '避難所A',
        '住所A',
        34.69,
        135.19,
        'emergency',
        'park',
        'https://example.com/a.jpg',
        100,
        1,
        'https://www.city.kobe.lg.jp/bosai/',
      );

    migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    const repository = createSqliteEvacuationShelterRepository(db as unknown as EvacuationDatabase);
    const {
      phoneNumber: _phoneNumber,
      suitability: _suitability,
      ...legacyShelter
    } = sampleShelters[0];
    await expect(repository.findAll()).resolves.toEqual([legacyShelter]);
  });

  it('災害種別ごとの適否を保存→取得で往復し、情報が無い避難所は suitability を持たない', async () => {
    const repository = createTestRepository();

    await repository.replaceAll(sampleShelters);

    const [withSuitability, withoutSuitability] = await Promise.all([
      repository.findById('shelter-1'),
      repository.findById('shelter-2'),
    ]);
    expect(withSuitability?.suitability).toEqual({
      landslide: 'suitable',
      flood: 'conditional',
      tsunami: 'unsuitable',
      'large-fire': 'not-applicable',
    });
    expect(withoutSuitability?.suitability).toBeUndefined();
  });

  it('suitability_* 列を追加するマイグレーションで既存レコードが壊れない', async () => {
    const sqlite = new Database(':memory:');
    openDatabases.push(sqlite);
    const db = drizzle(sqlite, { schema });

    // suitability_* 列が無い時点（0002 まで）の DB に、電話番号つきで 1 件保存しておく。
    migrate(db, { migrationsFolder: createMigrationsFolderUpTo(3) });
    sqlite
      .prepare(
        `INSERT INTO evacuation_shelters
          (id, name, address, latitude, longitude, type, facility_category, image_url, capacity, accessible, external_url, phone_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'shelter-1',
        '避難所A',
        '住所A',
        34.69,
        135.19,
        'emergency',
        'park',
        'https://example.com/a.jpg',
        100,
        1,
        'https://www.city.kobe.lg.jp/bosai/',
        '078-411-0556',
      );

    migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

    const repository = createSqliteEvacuationShelterRepository(db as unknown as EvacuationDatabase);
    const { suitability: _suitability, ...legacyShelter } = sampleShelters[0];
    await expect(repository.findAll()).resolves.toEqual([legacyShelter]);
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
