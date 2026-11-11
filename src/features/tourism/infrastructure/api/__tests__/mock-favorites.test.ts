import { useAuthStore } from '@/features/user/store/use-auth-store';
import { ApiError } from '@/shared/lib/api';

import { mockFavoriteRepository, resetMockFavorites } from '../mock-favorites';

const { fetchFavorites, addFavorite, removeFavorite } = mockFavoriteRepository;

function signInAs(id: string) {
  useAuthStore.setState({
    currentUser: { id, name: id, iconUrl: '' },
    accessToken: null,
    refreshToken: null,
  });
}

describe('mockFavoriteRepository', () => {
  beforeEach(() => {
    jest.useRealTimers();
    resetMockFavorites();
    signInAs('user-a');
  });

  it('最初は空', async () => {
    await expect(fetchFavorites()).resolves.toEqual([]);
  });

  it('追加したスポットが登録日時の新しい順で返る', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-01T00:00:00.000Z'), doNotFake: ['setTimeout'] });
    await addFavorite('spot-old');
    jest.setSystemTime(new Date('2026-11-02T00:00:00.000Z'));
    await addFavorite('spot-new');

    await expect(fetchFavorites()).resolves.toEqual([
      { spotId: 'spot-new', createdAt: '2026-11-02T00:00:00.000Z' },
      { spotId: 'spot-old', createdAt: '2026-11-01T00:00:00.000Z' },
    ]);
  });

  it('登録済みのスポットを追加しても 1 件のままで、登録日時も変わらない（冪等）', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-01T00:00:00.000Z'), doNotFake: ['setTimeout'] });
    await addFavorite('spot-a');
    jest.setSystemTime(new Date('2026-11-05T00:00:00.000Z'));
    await addFavorite('spot-a');

    await expect(fetchFavorites()).resolves.toEqual([
      { spotId: 'spot-a', createdAt: '2026-11-01T00:00:00.000Z' },
    ]);
  });

  it('削除したスポットは一覧から消える', async () => {
    await addFavorite('spot-a');
    await addFavorite('spot-b');

    await removeFavorite('spot-a');

    const favorites = await fetchFavorites();
    expect(favorites.map((f) => f.spotId)).toEqual(['spot-b']);
  });

  it('未登録のスポットを削除しても成功する（冪等）', async () => {
    await expect(removeFavorite('spot-unknown')).resolves.toBeUndefined();
  });

  it('ユーザーごとに分かれる', async () => {
    await addFavorite('spot-a');

    signInAs('user-b');
    await expect(fetchFavorites()).resolves.toEqual([]);

    signInAs('user-a');
    const favorites = await fetchFavorites();
    expect(favorites.map((f) => f.spotId)).toEqual(['spot-a']);
  });

  it('未ログインなら 401 で失敗する', async () => {
    useAuthStore.setState({ currentUser: null, accessToken: null, refreshToken: null });

    for (const call of [
      fetchFavorites,
      () => addFavorite('spot-a'),
      () => removeFavorite('spot-a'),
    ]) {
      const error = await call().catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(401);
    }
  });
});
