import { apiFetch } from '@/shared/lib/api';

import { fetchCurrentUser } from '../user-api';

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
