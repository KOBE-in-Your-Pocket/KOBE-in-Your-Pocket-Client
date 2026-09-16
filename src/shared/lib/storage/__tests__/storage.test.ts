import AsyncStorage from '@react-native-async-storage/async-storage';

import { getItem, removeItem, setItem } from '../index';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockGetItem = jest.mocked(AsyncStorage.getItem);
const mockSetItem = jest.mocked(AsyncStorage.setItem);
const mockRemoveItem = jest.mocked(AsyncStorage.removeItem);

describe('storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItem', () => {
    it('保存された JSON をデシリアライズして返す', async () => {
      mockGetItem.mockResolvedValue(JSON.stringify({ language: 'ja' }));

      await expect(getItem<{ language: string }>('settings')).resolves.toEqual({ language: 'ja' });
      expect(mockGetItem).toHaveBeenCalledWith('settings');
    });

    it('未保存の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue(null);

      await expect(getItem('missing')).resolves.toBeNull();
    });

    it('パース不能な値の場合は null を返す', async () => {
      mockGetItem.mockResolvedValue('not-json');

      await expect(getItem('broken')).resolves.toBeNull();
    });
  });

  describe('setItem', () => {
    it('値を JSON 文字列としてシリアライズして保存する', async () => {
      await setItem('settings', { language: 'ja' });

      expect(mockSetItem).toHaveBeenCalledWith('settings', JSON.stringify({ language: 'ja' }));
    });
  });

  describe('removeItem', () => {
    it('指定キーを削除する', async () => {
      await removeItem('settings');

      expect(mockRemoveItem).toHaveBeenCalledWith('settings');
    });
  });
});
