import { getItem, setItem } from '@/shared/lib/storage';

import {
  EVACUATION_SHELTERS_SEED_VERSION_STORAGE_KEY,
  getLastSeededShelterVersion,
  setLastSeededShelterVersion,
} from '../shelter-seed-version-storage';

jest.mock('@/shared/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = jest.mocked(getItem);
const mockSetItem = jest.mocked(setItem);

describe('shelter-seed-version-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLastSeededShelterVersion', () => {
    it('保存済みのシード版をそのまま返す', async () => {
      mockGetItem.mockResolvedValue(1);

      await expect(getLastSeededShelterVersion()).resolves.toBe(1);
      expect(mockGetItem).toHaveBeenCalledWith(EVACUATION_SHELTERS_SEED_VERSION_STORAGE_KEY);
    });

    it('未保存の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(getLastSeededShelterVersion()).resolves.toBeNull();
    });

    it.each([
      ['文字列', '1'],
      ['小数', 1.5],
      ['オブジェクト', { version: 1 }],
    ])('整数でない値（%s）の場合は null を返す', async (_label, stored) => {
      mockGetItem.mockResolvedValue(stored);

      await expect(getLastSeededShelterVersion()).resolves.toBeNull();
    });
  });

  describe('setLastSeededShelterVersion', () => {
    it('指定したシード版を保存する', async () => {
      await setLastSeededShelterVersion(1);

      expect(mockSetItem).toHaveBeenCalledWith(EVACUATION_SHELTERS_SEED_VERSION_STORAGE_KEY, 1);
    });
  });
});
