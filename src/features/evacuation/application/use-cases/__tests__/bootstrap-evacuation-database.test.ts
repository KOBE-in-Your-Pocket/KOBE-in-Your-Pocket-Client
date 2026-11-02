import { getEvacuationDatabase } from '../../../infrastructure/db/client';
import { runEvacuationMigrations } from '../../../infrastructure/db/run-migrations';
import { createSqliteEvacuationShelterRepository } from '../../../infrastructure/db/sqlite-evacuation-shelter-repository';
import {
  bootstrapEvacuationDatabase,
  recheckEvacuationDatabase,
  resetEvacuationDatabaseBootstrapForTests,
} from '../bootstrap-evacuation-database';
import {
  readShelterReseedState,
  reseedEvacuationSheltersIfNeeded,
} from '../reseed-evacuation-shelters-if-needed';

jest.mock('../../../infrastructure/api/shelter-api', () => ({
  fetchEvacuationShelterDataset: jest.fn(),
}));

jest.mock('../../../infrastructure/db/client', () => ({
  getEvacuationDatabase: jest.fn(),
}));

jest.mock('../../../infrastructure/db/run-migrations', () => ({
  runEvacuationMigrations: jest.fn(),
}));

jest.mock('../../../infrastructure/db/sqlite-evacuation-shelter-repository', () => ({
  createSqliteEvacuationShelterRepository: jest.fn(),
}));

jest.mock('../../../infrastructure/storage/shelter-language-storage', () => ({
  getLastSeededShelterLanguage: jest.fn(),
  setLastSeededShelterLanguage: jest.fn(),
}));

jest.mock('../../../infrastructure/storage/shelter-seed-version-storage', () => ({
  getLastSeededShelterVersion: jest.fn(),
  setLastSeededShelterVersion: jest.fn(),
}));

jest.mock('../../../infrastructure/storage/shelter-last-fetched-at-storage', () => ({
  getShelterLastFetchedAt: jest.fn(),
  setShelterLastFetchedAt: jest.fn(),
}));

jest.mock('../../../infrastructure/storage/shelter-dataset-metadata-storage', () => ({
  setShelterDatasetMetadata: jest.fn(),
}));

jest.mock('../reseed-evacuation-shelters-if-needed', () => ({
  readShelterReseedState: jest.fn(),
  reseedEvacuationSheltersIfNeeded: jest.fn(),
}));

const mockDb = {};
const mockRepository = {};

/** マイクロタスクのみで進む処理が predicate を満たすまで、少数回 tick を進める。 */
async function waitFor(predicate: () => boolean): Promise<void> {
  for (let i = 0; i < 20 && !predicate(); i++) {
    await Promise.resolve();
  }
}

describe('bootstrapEvacuationDatabase', () => {
  beforeEach(() => {
    resetEvacuationDatabaseBootstrapForTests();
    jest.clearAllMocks();

    jest.mocked(getEvacuationDatabase).mockReturnValue(mockDb as never);
    jest.mocked(createSqliteEvacuationShelterRepository).mockReturnValue(mockRepository as never);
    jest.mocked(runEvacuationMigrations).mockResolvedValue(undefined);
    jest
      .mocked(readShelterReseedState)
      .mockResolvedValue({ existing: [], now: 0, timing: 'blocking' });
    jest.mocked(reseedEvacuationSheltersIfNeeded).mockResolvedValue(true);
  });

  describe('再シードのタイミング（#694）', () => {
    it('再シード不要なら取得せず reseeded は false になる', async () => {
      jest
        .mocked(readShelterReseedState)
        .mockResolvedValue({ existing: [], now: 0, timing: 'none' });

      const { reseeded } = await bootstrapEvacuationDatabase('ja');

      await expect(reseeded).resolves.toBe(false);
      expect(reseedEvacuationSheltersIfNeeded).not.toHaveBeenCalled();
    });

    it('blocking は再シードの完了を待ってから解決する', async () => {
      let resolveReseed: ((value: boolean) => void) | undefined;
      jest.mocked(reseedEvacuationSheltersIfNeeded).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReseed = resolve;
          }),
      );
      const onSettled = jest.fn();

      const bootstrap = bootstrapEvacuationDatabase('ja');
      void bootstrap.then(onSettled);
      await waitFor(() => resolveReseed !== undefined);
      expect(onSettled).not.toHaveBeenCalled();

      resolveReseed?.(true);
      await expect((await bootstrap).reseeded).resolves.toBe(true);
    });

    it('background は再シードの完了を待たずに解決し、結果を reseeded で返す', async () => {
      jest
        .mocked(readShelterReseedState)
        .mockResolvedValue({ existing: [], now: 0, timing: 'background' });
      let resolveReseed: ((value: boolean) => void) | undefined;
      jest.mocked(reseedEvacuationSheltersIfNeeded).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReseed = resolve;
          }),
      );

      const { reseeded } = await bootstrapEvacuationDatabase('ja');
      expect(resolveReseed).toBeDefined();

      resolveReseed?.(true);
      await expect(reseeded).resolves.toBe(true);
    });

    it('background の再シードが失敗しても reject せず reseeded は false になる', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      jest
        .mocked(readShelterReseedState)
        .mockResolvedValue({ existing: [], now: 0, timing: 'background' });
      jest.mocked(reseedEvacuationSheltersIfNeeded).mockRejectedValue(new Error('db error'));

      const { reseeded } = await bootstrapEvacuationDatabase('ja');

      await expect(reseeded).resolves.toBe(false);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('別言語の bootstrap は裏の再シードの完了を待ってから始まる（#487）', async () => {
      jest
        .mocked(readShelterReseedState)
        .mockResolvedValueOnce({ existing: [], now: 0, timing: 'background' });
      let resolveReseed: ((value: boolean) => void) | undefined;
      jest.mocked(reseedEvacuationSheltersIfNeeded).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveReseed = resolve;
          }),
      );

      await bootstrapEvacuationDatabase('ja');
      const second = bootstrapEvacuationDatabase('en');

      for (let i = 0; i < 20; i++) {
        await Promise.resolve();
      }
      expect(readShelterReseedState).toHaveBeenCalledTimes(1);

      resolveReseed?.(true);
      await second;
      expect(readShelterReseedState).toHaveBeenCalledTimes(2);
    });
  });

  describe('recheckEvacuationDatabase', () => {
    const stateOf = (timing: 'none' | 'background') => ({ existing: [], now: 0, timing });

    beforeEach(() => {
      jest.mocked(readShelterReseedState).mockResolvedValue(stateOf('none'));
    });

    it('24 時間が経っていなければ再シードしない', async () => {
      await bootstrapEvacuationDatabase('ja');

      const { reseeded } = await recheckEvacuationDatabase('ja');

      await expect(reseeded).resolves.toBe(false);
      expect(readShelterReseedState).toHaveBeenCalledTimes(2);
      expect(reseedEvacuationSheltersIfNeeded).not.toHaveBeenCalled();
    });

    it('24 時間が経っていれば裏で取り直し、結果を reseeded で返す', async () => {
      await bootstrapEvacuationDatabase('ja');
      jest.mocked(readShelterReseedState).mockResolvedValue(stateOf('background'));

      const { reseeded } = await recheckEvacuationDatabase('ja');

      await expect(reseeded).resolves.toBe(true);
      expect(reseedEvacuationSheltersIfNeeded).toHaveBeenCalledTimes(1);
    });

    it('裏の取り直しに失敗したあとは、次の呼び出しで再び取り直す', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      jest.mocked(readShelterReseedState).mockResolvedValue(stateOf('background'));
      jest.mocked(reseedEvacuationSheltersIfNeeded).mockRejectedValueOnce(new Error('offline'));

      const first = await bootstrapEvacuationDatabase('ja');
      await expect(first.reseeded).resolves.toBe(false);

      const second = await recheckEvacuationDatabase('ja');

      await expect(second.reseeded).resolves.toBe(true);
      expect(reseedEvacuationSheltersIfNeeded).toHaveBeenCalledTimes(2);
      consoleError.mockRestore();
    });

    it('裏の取り直しの実行中は何もせず、読み手も待たせない', async () => {
      jest.mocked(readShelterReseedState).mockResolvedValue(stateOf('background'));
      let resolveReseed: ((value: boolean) => void) | undefined;
      jest.mocked(reseedEvacuationSheltersIfNeeded).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveReseed = resolve;
          }),
      );

      const first = await bootstrapEvacuationDatabase('ja');
      const { reseeded } = await recheckEvacuationDatabase('ja');

      await expect(reseeded).resolves.toBe(false);
      await expect(bootstrapEvacuationDatabase('ja')).resolves.toBe(first);
      expect(reseedEvacuationSheltersIfNeeded).toHaveBeenCalledTimes(1);

      resolveReseed?.(true);
      await expect(first.reseeded).resolves.toBe(true);
    });

    it('bootstrap の実行中は何もしない', async () => {
      let resolveMigration: (() => void) | undefined;
      jest.mocked(runEvacuationMigrations).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveMigration = resolve;
          }),
      );

      const running = bootstrapEvacuationDatabase('ja');
      const { reseeded } = await recheckEvacuationDatabase('ja');

      await expect(reseeded).resolves.toBe(false);

      await waitFor(() => resolveMigration !== undefined);
      resolveMigration?.();
      await running;
      expect(runEvacuationMigrations).toHaveBeenCalledTimes(1);
    });
  });

  it('失敗時は Promise キャッシュをクリアし、再呼び出しでリトライできる', async () => {
    jest
      .mocked(runEvacuationMigrations)
      .mockRejectedValueOnce(new Error('migration failed'))
      .mockResolvedValueOnce(undefined);

    await expect(bootstrapEvacuationDatabase('ja')).rejects.toThrow('migration failed');
    await expect(bootstrapEvacuationDatabase('ja')).resolves.toBeDefined();

    expect(runEvacuationMigrations).toHaveBeenCalledTimes(2);
    expect(reseedEvacuationSheltersIfNeeded).toHaveBeenCalledTimes(1);
  });

  it('同じ言語での進行中の Promise を共有し、同時呼び出しで二重 bootstrap しない', async () => {
    let resolveMigration: (() => void) | undefined;
    jest.mocked(runEvacuationMigrations).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveMigration = resolve;
        }),
    );

    const first = bootstrapEvacuationDatabase('ja');
    const second = bootstrapEvacuationDatabase('ja');

    await waitFor(() => resolveMigration !== undefined);
    resolveMigration?.();
    await Promise.all([first, second]);
    expect(first).toBe(second);

    expect(runEvacuationMigrations).toHaveBeenCalledTimes(1);
    expect(reseedEvacuationSheltersIfNeeded).toHaveBeenCalledTimes(1);
    expect(reseedEvacuationSheltersIfNeeded).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'ja' }),
      expect.objectContaining({ timing: 'blocking' }),
    );
  });

  it('別言語での呼び出しは進行中の bootstrap の完了を待ってから実行する（並行実行によるDB/AsyncStorageの不整合を防ぐ）', async () => {
    const events: string[] = [];
    let resolveJaReseed: (() => void) | undefined;

    jest.mocked(reseedEvacuationSheltersIfNeeded).mockImplementation((deps) => {
      events.push(`start:${deps.language}`);
      if (deps.language === 'ja') {
        return new Promise((resolve) => {
          resolveJaReseed = () => {
            events.push('resolve:ja');
            resolve(true);
          };
        });
      }
      return Promise.resolve(true);
    });

    const first = bootstrapEvacuationDatabase('ja');
    const second = bootstrapEvacuationDatabase('en');

    await waitFor(() => resolveJaReseed !== undefined);
    // 'ja' の reseed がまだ完了していない間は 'en' 側は開始されていないはず。
    expect(events).toEqual(['start:ja']);

    resolveJaReseed?.();
    await Promise.all([first, second]);

    expect(events).toEqual(['start:ja', 'resolve:ja', 'start:en']);
    expect(reseedEvacuationSheltersIfNeeded).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ language: 'ja' }),
      expect.objectContaining({ timing: 'blocking' }),
    );
    expect(reseedEvacuationSheltersIfNeeded).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ language: 'en' }),
      expect.objectContaining({ timing: 'blocking' }),
    );
  });

  it('後ろに連結された別言語の呼び出しがある間に古い言語側が失敗しても、その追跡状態を巻き添えでクリアしない', async () => {
    let resolveEnReseed: (() => void) | undefined;
    jest.mocked(reseedEvacuationSheltersIfNeeded).mockImplementation((deps) => {
      if (deps.language === 'ja') {
        return Promise.reject(new Error('offline'));
      }
      return new Promise((resolve) => {
        resolveEnReseed = () => resolve(true);
      });
    });

    const first = bootstrapEvacuationDatabase('ja');
    const second = bootstrapEvacuationDatabase('en');

    await expect(first).rejects.toThrow('offline');

    // 'ja' の失敗ハンドラが 'en' の進行中の Promise を巻き添えでクリアしていなければ、
    // 同じ 'en' への呼び出しは dedupe されて同一 Promise を返すはず。
    const third = bootstrapEvacuationDatabase('en');
    expect(third).toBe(second);

    await waitFor(() => resolveEnReseed !== undefined);
    resolveEnReseed?.();
    await expect(second).resolves.toBeDefined();

    const enCalls = jest
      .mocked(reseedEvacuationSheltersIfNeeded)
      .mock.calls.filter(([deps]) => deps.language === 'en');
    expect(enCalls).toHaveLength(1);
  });
});
