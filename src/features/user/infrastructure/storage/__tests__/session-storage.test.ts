import * as SecureStore from 'expo-secure-store';

import {
  clearPersistedSession,
  loadPersistedSession,
  savePersistedSession,
  updatePersistedUser,
} from '../session-storage';

const getItemAsync = SecureStore.getItemAsync as jest.Mock;
const setItemAsync = SecureStore.setItemAsync as jest.Mock;
const deleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;

const SESSION = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: 'Google 太郎', iconUrl: '' },
};

describe('session-storage', () => {
  beforeEach(() => {
    getItemAsync.mockReset().mockResolvedValue(null);
    setItemAsync.mockReset().mockResolvedValue(undefined);
    deleteItemAsync.mockReset().mockResolvedValue(undefined);
  });

  describe('savePersistedSession', () => {
    it('refreshToken とユーザーのみを保存する（短命な accessToken は保存しない）', async () => {
      await savePersistedSession(SESSION);

      expect(setItemAsync).toHaveBeenCalledTimes(1);
      const [key, value] = setItemAsync.mock.calls[0];
      expect(key).toBe('auth.session');
      expect(JSON.parse(value)).toEqual({
        refreshToken: 'refresh-token',
        user: SESSION.user,
      });
    });
  });

  describe('loadPersistedSession', () => {
    it('未保存の場合は null を返す', async () => {
      await expect(loadPersistedSession()).resolves.toBeNull();
    });

    it('保存済みセッションを読み出す', async () => {
      getItemAsync.mockResolvedValue(
        JSON.stringify({ refreshToken: 'refresh-token', user: SESSION.user }),
      );

      await expect(loadPersistedSession()).resolves.toEqual({
        refreshToken: 'refresh-token',
        user: SESSION.user,
      });
    });

    it('JSON としてパースできない場合は null を返す', async () => {
      getItemAsync.mockResolvedValue('{broken json');

      await expect(loadPersistedSession()).resolves.toBeNull();
    });

    it('形式が想定と異なる場合は null を返す', async () => {
      getItemAsync.mockResolvedValue(JSON.stringify({ refreshToken: 123 }));

      await expect(loadPersistedSession()).resolves.toBeNull();
    });
  });

  describe('updatePersistedUser', () => {
    it('保存済みセッションのユーザー情報のみ差し替える', async () => {
      getItemAsync.mockResolvedValue(
        JSON.stringify({ refreshToken: 'refresh-token', user: SESSION.user }),
      );
      const updatedUser = {
        id: 'user-1',
        name: '新しい名前',
        iconUrl: 'https://i.pravatar.cc/150?img=5',
      };

      await updatePersistedUser(updatedUser);

      expect(setItemAsync).toHaveBeenCalledTimes(1);
      const [key, value] = setItemAsync.mock.calls[0];
      expect(key).toBe('auth.session');
      expect(JSON.parse(value)).toEqual({
        refreshToken: 'refresh-token',
        user: updatedUser,
      });
    });

    it('未保存（モックログインなど）の場合は何もしない', async () => {
      await updatePersistedUser(SESSION.user);

      expect(setItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('clearPersistedSession', () => {
    it('保存済みセッションを削除する', async () => {
      await clearPersistedSession();

      expect(deleteItemAsync).toHaveBeenCalledWith('auth.session');
    });
  });
});
