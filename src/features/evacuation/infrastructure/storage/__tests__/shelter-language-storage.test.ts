import { getItem, setItem } from '@/shared/lib/storage';

import {
  EVACUATION_SHELTERS_LANGUAGE_STORAGE_KEY,
  getLastSeededShelterLanguage,
  setLastSeededShelterLanguage,
} from '../shelter-language-storage';

jest.mock('@/shared/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = jest.mocked(getItem);
const mockSetItem = jest.mocked(setItem);

describe('shelter-language-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLastSeededShelterLanguage', () => {
    it('保存済みのサポート言語をそのまま返す', async () => {
      mockGetItem.mockResolvedValue('ja');

      await expect(getLastSeededShelterLanguage()).resolves.toBe('ja');
      expect(mockGetItem).toHaveBeenCalledWith(EVACUATION_SHELTERS_LANGUAGE_STORAGE_KEY);
    });

    it('未保存の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(getLastSeededShelterLanguage()).resolves.toBeNull();
    });

    it('サポート外の値の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue('fr');

      await expect(getLastSeededShelterLanguage()).resolves.toBeNull();
    });
  });

  describe('setLastSeededShelterLanguage', () => {
    it('指定した言語を保存する', async () => {
      await setLastSeededShelterLanguage('en');

      expect(mockSetItem).toHaveBeenCalledWith(EVACUATION_SHELTERS_LANGUAGE_STORAGE_KEY, 'en');
    });
  });
});
