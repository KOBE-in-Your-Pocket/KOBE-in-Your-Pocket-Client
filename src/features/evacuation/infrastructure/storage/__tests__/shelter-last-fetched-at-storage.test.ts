import { getItem, setItem } from '@/shared/lib/storage';

import {
  EVACUATION_SHELTERS_LAST_FETCHED_AT_STORAGE_KEY,
  getShelterLastFetchedAt,
  setShelterLastFetchedAt,
} from '../shelter-last-fetched-at-storage';

jest.mock('@/shared/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = jest.mocked(getItem);
const mockSetItem = jest.mocked(setItem);

describe('shelter-last-fetched-at-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShelterLastFetchedAt', () => {
    it('保存済みの日時をそのまま返す', async () => {
      mockGetItem.mockResolvedValue(1_700_000_000_000);

      await expect(getShelterLastFetchedAt()).resolves.toBe(1_700_000_000_000);
      expect(mockGetItem).toHaveBeenCalledWith(EVACUATION_SHELTERS_LAST_FETCHED_AT_STORAGE_KEY);
    });

    it('未保存の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(getShelterLastFetchedAt()).resolves.toBeNull();
    });

    it.each([
      ['文字列', '1700000000000'],
      ['NaN', Number.NaN],
      ['Infinity', Number.POSITIVE_INFINITY],
      ['オブジェクト', { fetchedAt: 1 }],
    ])('有限の数値でない値（%s）の場合は null を返す', async (_label, stored) => {
      mockGetItem.mockResolvedValue(stored);

      await expect(getShelterLastFetchedAt()).resolves.toBeNull();
    });
  });

  describe('setShelterLastFetchedAt', () => {
    it('指定した日時を保存する', async () => {
      await setShelterLastFetchedAt(1_700_000_000_000);

      expect(mockSetItem).toHaveBeenCalledWith(
        EVACUATION_SHELTERS_LAST_FETCHED_AT_STORAGE_KEY,
        1_700_000_000_000,
      );
    });
  });
});
