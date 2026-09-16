import * as Localization from 'expo-localization';

import { getItem } from '@/shared/lib/storage';

import { FALLBACK_LANGUAGE } from '../language';
import {
  LANGUAGE_STORAGE_KEY,
  loadPersistedLanguage,
  resolveInitialLanguage,
} from '../persisted-language';

jest.mock('@/shared/lib/storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

const mockGetItem = jest.mocked(getItem);
const mockGetLocales = jest.mocked(Localization.getLocales);

function mockDeviceLanguage(languageCode: string): void {
  mockGetLocales.mockReturnValue([
    { languageCode } as ReturnType<typeof Localization.getLocales>[number],
  ]);
}

describe('persisted-language', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPersistedLanguage', () => {
    it('保存済みのサポート言語をそのまま返す', async () => {
      mockGetItem.mockResolvedValue('ja');

      await expect(loadPersistedLanguage()).resolves.toBe('ja');
      expect(mockGetItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY);
    });

    it('未保存の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(loadPersistedLanguage()).resolves.toBeNull();
    });

    it('サポート外の値の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue('fr');

      await expect(loadPersistedLanguage()).resolves.toBeNull();
    });
  });

  describe('resolveInitialLanguage', () => {
    it('保存済み言語があればそれを採用する', async () => {
      mockGetItem.mockResolvedValue('ko');
      mockDeviceLanguage('ja');

      await expect(resolveInitialLanguage()).resolves.toBe('ko');
    });

    it('保存値が無い場合はデバイス言語へフォールバックする', async () => {
      mockGetItem.mockResolvedValue(null);
      mockDeviceLanguage('ja');

      await expect(resolveInitialLanguage()).resolves.toBe('ja');
    });

    it('保存値が無くデバイス言語もサポート外の場合は en へフォールバックする', async () => {
      mockGetItem.mockResolvedValue(null);
      mockDeviceLanguage('fr');

      await expect(resolveInitialLanguage()).resolves.toBe(FALLBACK_LANGUAGE);
    });
  });
});
