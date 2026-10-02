import { apiFetch } from '@/shared/lib/api';

import { deleteCurrentUser, fetchCurrentUser } from '../user-api';

jest.mock('@/shared/lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);

describe('fetchCurrentUser', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('認証付きで /users/me を呼ぶ', async () => {
    mockApiFetch.mockResolvedValue({ id: 'user-1', name: '荒川蓮', iconUrl: null });

    await fetchCurrentUser();

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me', { auth: true });
  });

  it('レスポンスを PublicUser に変換する', async () => {
    mockApiFetch.mockResolvedValue({
      id: 'user-1',
      name: '荒川蓮',
      iconUrl: 'https://example.com/icon.png',
    });

    await expect(fetchCurrentUser()).resolves.toEqual({
      id: 'user-1',
      name: '荒川蓮',
      iconUrl: 'https://example.com/icon.png',
    });
  });

  it('iconUrl が null なら空文字に寄せる', async () => {
    mockApiFetch.mockResolvedValue({ id: 'user-1', name: '荒川蓮', iconUrl: null });

    const user = await fetchCurrentUser();

    expect(user.iconUrl).toBe('');
  });
});

describe('deleteCurrentUser', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue(undefined);
  });

  it('認証付きで DELETE /users/me を呼ぶ', async () => {
    await deleteCurrentUser();

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me', {
      method: 'DELETE',
      auth: true,
    });
  });
});
