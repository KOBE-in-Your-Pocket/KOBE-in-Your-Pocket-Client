import { useReviewStore } from '@/features/tourism/store/use-review-store';

import { useAuthStore } from '../../store/use-auth-store';
import { performProfileUpdate } from '../use-update-profile';

const USER = { id: 'user-1', name: 'Google 太郎', iconUrl: '' };
const ICON_URL = 'https://i.pravatar.cc/150?img=5';

describe('performProfileUpdate', () => {
  const updatePersistedUser = jest.fn();
  const updateCurrentUser = jest.fn();
  const deps = {
    persistedUserStore: { updatePersistedUser },
    userGateway: { updateCurrentUser },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    updatePersistedUser.mockResolvedValue(undefined);
    updateCurrentUser.mockImplementation(async (request: { name?: string }) => ({
      id: 'user-1',
      name: request.name ?? USER.name,
      iconUrl: USER.iconUrl,
    }));
    useAuthStore.setState({
      currentUser: USER,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    useReviewStore.setState({ submittedReviews: {} });
  });

  it('表示名（trim 済み）を PATCH し、応答の名前をストアと永続化へ反映する', async () => {
    await performProfileUpdate({ name: '  新しい名前  ', iconUrl: '' }, deps);

    expect(updateCurrentUser).toHaveBeenCalledWith({ name: '新しい名前', iconUrl: '' });
    const updated = { id: 'user-1', name: '新しい名前', iconUrl: '' };
    expect(useAuthStore.getState().currentUser).toEqual(updated);
    expect(updatePersistedUser).toHaveBeenCalledWith(updated);
  });

  it('アイコンの URL は送らず、編集値をローカルにだけ反映する', async () => {
    await performProfileUpdate({ name: '新しい名前', iconUrl: ICON_URL }, deps);

    expect(updateCurrentUser).toHaveBeenCalledWith({ name: '新しい名前' });
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe(ICON_URL);
    expect(updatePersistedUser).toHaveBeenCalledWith({
      id: 'user-1',
      name: '新しい名前',
      iconUrl: ICON_URL,
    });
  });

  it('アイコンを未設定にするときは、ローカルの値に関係なく iconUrl を空文字で送る', async () => {
    useAuthStore.setState({ currentUser: { ...USER, iconUrl: ICON_URL } });

    await performProfileUpdate({ name: 'Google 太郎', iconUrl: '' }, deps);

    expect(updateCurrentUser).toHaveBeenCalledWith({ name: 'Google 太郎', iconUrl: '' });
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe('');
  });

  it('ローカルがすでに未設定でも、未設定の指定は空文字で送る', async () => {
    await performProfileUpdate({ name: 'Google 太郎', iconUrl: '' }, deps);

    expect(updateCurrentUser).toHaveBeenCalledWith({ name: 'Google 太郎', iconUrl: '' });
  });

  it('送信に失敗したらストアも永続化も変えず、例外を伝える', async () => {
    updateCurrentUser.mockRejectedValue(new Error('network error'));

    await expect(performProfileUpdate({ name: '新しい名前', iconUrl: '' }, deps)).rejects.toThrow(
      'network error',
    );

    expect(useAuthStore.getState().currentUser).toEqual(USER);
    expect(updatePersistedUser).not.toHaveBeenCalled();
  });

  it('表示名が空白のみの場合は API を呼ばず、エラーにする', async () => {
    await expect(performProfileUpdate({ name: '   ', iconUrl: '' }, deps)).rejects.toThrow();

    expect(updateCurrentUser).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toEqual(USER);
    expect(updatePersistedUser).not.toHaveBeenCalled();
  });

  it('未ログイン時は API を呼ばず、エラーにする', async () => {
    useAuthStore.getState().logout();

    await expect(performProfileUpdate({ name: '新しい名前', iconUrl: '' }, deps)).rejects.toThrow();

    expect(updateCurrentUser).not.toHaveBeenCalled();
    expect(updatePersistedUser).not.toHaveBeenCalled();
  });

  it('送信中にログアウトされていたら、古いユーザーをストアへ書き戻さない', async () => {
    updateCurrentUser.mockImplementation(async () => {
      useAuthStore.getState().logout();
      return { id: 'user-1', name: '新しい名前', iconUrl: '' };
    });

    await performProfileUpdate({ name: '新しい名前', iconUrl: '' }, deps);

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(updatePersistedUser).not.toHaveBeenCalled();
  });

  it('送信中に別ユーザーでログインし直していたら、前のユーザーの値で上書きしない', async () => {
    const OTHER_USER = { id: 'user-2', name: '別の人', iconUrl: '' };
    updateCurrentUser.mockImplementation(async () => {
      useAuthStore.setState({ currentUser: OTHER_USER });
      return { id: 'user-1', name: '新しい名前', iconUrl: '' };
    });

    await performProfileUpdate({ name: '新しい名前', iconUrl: '' }, deps);

    expect(useAuthStore.getState().currentUser).toEqual(OTHER_USER);
    expect(updatePersistedUser).not.toHaveBeenCalled();
  });

  it('永続化に失敗してもストアの更新は維持する', async () => {
    updatePersistedUser.mockRejectedValue(new Error('secure-store failed'));

    await performProfileUpdate({ name: '新しい名前', iconUrl: '' }, deps);

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

    await performProfileUpdate({ name: '新しい名前', iconUrl: ICON_URL }, deps);

    const reviews = useReviewStore.getState().submittedReviews['spot-a'];
    expect(reviews.find((r) => r.id === 'r1')?.author).toEqual({
      id: USER.id,
      name: '新しい名前',
      iconUrl: ICON_URL,
    });
    expect(reviews.find((r) => r.id === 'r2')?.author).toEqual({
      id: 'other-user',
      name: '他人',
      iconUrl: '',
    });
  });
});
