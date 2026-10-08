import { File } from 'expo-file-system';

import { apiFetch } from '@/shared/lib/api';

import { deleteCurrentUser, fetchCurrentUser, updateCurrentUser, uploadMyIcon } from '../user-api';

jest.mock('@/shared/lib/api', () => ({
  apiFetch: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({ uri })),
}));

const mockApiFetch = jest.mocked(apiFetch);
const mockFile = jest.mocked(File);

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

describe('updateCurrentUser', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('認証付きで PATCH /users/me に送るボディをそのまま渡す', async () => {
    mockApiFetch.mockResolvedValue({ id: 'user-1', name: '新しい名前', iconUrl: null });

    await updateCurrentUser({ name: '新しい名前' });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me', {
      method: 'PATCH',
      body: { name: '新しい名前' },
      auth: true,
    });
  });

  it('アイコンを未設定に戻すときは iconUrl の空文字を送る', async () => {
    mockApiFetch.mockResolvedValue({ id: 'user-1', name: '荒川蓮', iconUrl: null });

    await updateCurrentUser({ name: '荒川蓮', iconUrl: '' });

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me', {
      method: 'PATCH',
      body: { name: '荒川蓮', iconUrl: '' },
      auth: true,
    });
  });

  it('応答を PublicUser に変換する（iconUrl が null なら空文字）', async () => {
    mockApiFetch.mockResolvedValue({ id: 'user-1', name: '新しい名前', iconUrl: null });

    await expect(updateCurrentUser({ name: '新しい名前' })).resolves.toEqual({
      id: 'user-1',
      name: '新しい名前',
      iconUrl: '',
    });
  });
});

describe('uploadMyIcon', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('認証付きで POST /users/me/icon に FormData の file フィールドで送る', async () => {
    mockApiFetch.mockResolvedValue({ id: 'user-1', name: '荒川蓮', iconUrl: null });
    const appendSpy = jest.spyOn(FormData.prototype, 'append');

    await uploadMyIcon('file:///tmp/icon.jpg');

    expect(mockFile).toHaveBeenCalledWith('file:///tmp/icon.jpg');
    expect(appendSpy).toHaveBeenCalledWith(
      'file',
      expect.objectContaining({ uri: 'file:///tmp/icon.jpg' }),
    );
    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/users/me/icon', {
      method: 'POST',
      body: expect.any(FormData),
      auth: true,
    });
    appendSpy.mockRestore();
  });

  it('応答を PublicUser に変換する', async () => {
    mockApiFetch.mockResolvedValue({
      id: 'user-1',
      name: '荒川蓮',
      iconUrl: 'https://example.com/icon.jpg',
    });

    await expect(uploadMyIcon('file:///tmp/icon.jpg')).resolves.toEqual({
      id: 'user-1',
      name: '荒川蓮',
      iconUrl: 'https://example.com/icon.jpg',
    });
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
