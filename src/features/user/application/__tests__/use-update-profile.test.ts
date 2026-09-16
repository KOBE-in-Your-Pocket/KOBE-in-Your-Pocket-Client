import { useReviewStore } from '@/features/tourism/store/use-review-store';

import { useAuthStore } from '../../store/use-auth-store';
import { performProfileUpdate } from '../use-update-profile';

const USER = { id: 'user-1', name: 'Google 太郎', iconUrl: '' };

describe('performProfileUpdate', () => {
  const updatePersistedUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    updatePersistedUser.mockResolvedValue(undefined);
    useAuthStore.setState({
      currentUser: USER,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    useReviewStore.setState({ submittedReviews: {} });
  });

  it('表示名（trim 済み）とアイコンをストアと永続化へ反映する', async () => {
    await performProfileUpdate(
      { name: '  新しい名前  ', iconUrl: 'https://i.pravatar.cc/150?img=5' },
      { persistedUserStore: { updatePersistedUser } },
    );

    const updated = {
      id: 'user-1',
      name: '新しい名前',
      iconUrl: 'https://i.pravatar.cc/150?img=5',
    };
    expect(useAuthStore.getState().currentUser).toEqual(updated);
    expect(updatePersistedUser).toHaveBeenCalledWith(updated);
  });

  it('トークンは変更しない', async () => {
    await performProfileUpdate(
      { name: '新しい名前', iconUrl: '' },
      { persistedUserStore: { updatePersistedUser } },
    );

    expect(useAuthStore.getState().accessToken).toBe('access-token');
    expect(useAuthStore.getState().refreshToken).toBe('refresh-token');
  });

  it('表示名が空白のみの場合はエラーにして何も更新しない', async () => {
    await expect(
      performProfileUpdate(
        { name: '   ', iconUrl: '' },
        { persistedUserStore: { updatePersistedUser } },
      ),
    ).rejects.toThrow();

    expect(useAuthStore.getState().currentUser).toEqual(USER);
    expect(updatePersistedUser).not.toHaveBeenCalled();
  });

  it('未ログイン時はエラーにする', async () => {
    useAuthStore.getState().logout();

    await expect(
      performProfileUpdate(
        { name: '新しい名前', iconUrl: '' },
        { persistedUserStore: { updatePersistedUser } },
      ),
    ).rejects.toThrow();
    expect(updatePersistedUser).not.toHaveBeenCalled();
  });

  it('永続化に失敗してもストアの更新は維持する', async () => {
    updatePersistedUser.mockRejectedValue(new Error('secure-store failed'));

    await performProfileUpdate(
      { name: '新しい名前', iconUrl: '' },
      { persistedUserStore: { updatePersistedUser } },
    );

    expect(useAuthStore.getState().currentUser?.name).toBe('新しい名前');
  });

  it('自分の投稿済みレビューの author.name / iconUrl を更新する（#516）', async () => {
    useReviewStore.getState().addReview('spot-a', {
      id: 'r1',
      rating: { value: 5 },
      comment: 'すばらしい眺めでした',
      author: { id: USER.id, name: USER.name, iconUrl: USER.iconUrl },
      postedAt: '2026-06-29T00:00:00.000Z',
      language: 'ja',
    });
    useReviewStore.getState().addReview('spot-a', {
      id: 'r2',
      rating: { value: 4 },
      comment: '他人の投稿',
      author: { id: 'other-user', name: '他人', iconUrl: '' },
      postedAt: '2026-06-29T00:00:00.000Z',
      language: 'ja',
    });

    await performProfileUpdate(
      { name: '新しい名前', iconUrl: 'https://i.pravatar.cc/150?img=5' },
      { persistedUserStore: { updatePersistedUser } },
    );

    const reviews = useReviewStore.getState().submittedReviews['spot-a'];
    expect(reviews.find((r) => r.id === 'r1')?.author).toEqual({
      id: USER.id,
      name: '新しい名前',
      iconUrl: 'https://i.pravatar.cc/150?img=5',
    });
    expect(reviews.find((r) => r.id === 'r2')?.author).toEqual({
      id: 'other-user',
      name: '他人',
      iconUrl: '',
    });
  });
});
