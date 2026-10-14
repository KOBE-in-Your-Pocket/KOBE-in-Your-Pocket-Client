import * as SecureStore from 'expo-secure-store';

import {
  clearPendingAppleName,
  loadPendingAppleName,
  savePendingAppleName,
} from '../apple-pending-name-storage';

describe('apple-pending-name-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('表示名を JSON で保存する', async () => {
    await savePendingAppleName({ appleUserId: 'apple-user-1', name: '山田 太郎' });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth.pendingAppleName',
      JSON.stringify({ appleUserId: 'apple-user-1', name: '山田 太郎' }),
    );
  });

  it('保存済みの表示名を読み出す', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ appleUserId: 'apple-user-1', name: '山田 太郎' }),
    );

    await expect(loadPendingAppleName()).resolves.toEqual({
      appleUserId: 'apple-user-1',
      name: '山田 太郎',
    });
  });

  it.each([null, 'not-json', JSON.stringify({ name: '山田 太郎' })])(
    '未保存・不正な値（%p）なら null を返す',
    async (raw) => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(raw);

      await expect(loadPendingAppleName()).resolves.toBeNull();
    },
  );

  it('削除する', async () => {
    await clearPendingAppleName();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.pendingAppleName');
  });
});
