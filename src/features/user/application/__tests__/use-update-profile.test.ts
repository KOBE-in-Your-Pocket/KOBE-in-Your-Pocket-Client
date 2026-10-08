import { useReviewStore } from '@/features/tourism/store/use-review-store';

import { useAuthStore } from '../../store/use-auth-store';
import { bumpSessionGeneration } from '../session-operation';
import { performProfileUpdate } from '../use-update-profile';

const USER = { id: 'user-1', name: 'Google 太郎', iconUrl: '' };
const NEW_ICON_URI = 'file:///tmp/icon.jpg';
const UPLOADED_ICON_URL = 'https://media.example.com/icons/icon-1.jpg';

describe('performProfileUpdate', () => {
  const updatePersistedUser = jest.fn();
  const updateCurrentUser = jest.fn();
  const uploadMyIcon = jest.fn();
  const deps = {
    persistedUserStore: { updatePersistedUser },
    userGateway: { updateCurrentUser, uploadMyIcon },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    updatePersistedUser.mockResolvedValue(undefined);
    updateCurrentUser.mockImplementation(async (request: { name?: string }) => ({
      id: 'user-1',
      name: request.name ?? USER.name,
      iconUrl: USER.iconUrl,
    }));
    uploadMyIcon.mockResolvedValue({ id: 'user-1', name: USER.name, iconUrl: UPLOADED_ICON_URL });
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

  it('アイコンを未設定にするときは iconUrl を空文字で送り、アップロードは呼ばない', async () => {
    useAuthStore.setState({ currentUser: { ...USER, iconUrl: UPLOADED_ICON_URL } });

    await performProfileUpdate({ name: 'Google 太郎', iconUrl: '' }, deps);

    expect(updateCurrentUser).toHaveBeenCalledWith({ name: 'Google 太郎', iconUrl: '' });
    expect(uploadMyIcon).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe('');
  });

  it('newIconUri を指定せずアイコンを変更しない場合はアップロードを呼ばない', async () => {
    useAuthStore.setState({ currentUser: { ...USER, iconUrl: UPLOADED_ICON_URL } });

    await performProfileUpdate({ name: '新しい名前', iconUrl: UPLOADED_ICON_URL }, deps);

    expect(uploadMyIcon).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe(UPLOADED_ICON_URL);
  });

  it('newIconUri を指定したときはアイコンをアップロードし、応答の iconUrl を反映する', async () => {
    await performProfileUpdate(
      { name: '新しい名前', iconUrl: USER.iconUrl, newIconUri: NEW_ICON_URI },
      deps,
    );

    expect(uploadMyIcon).toHaveBeenCalledWith(NEW_ICON_URI);
    const updated = { id: 'user-1', name: '新しい名前', iconUrl: UPLOADED_ICON_URL };
    expect(useAuthStore.getState().currentUser).toEqual(updated);
    expect(updatePersistedUser).toHaveBeenCalledWith(updated);
  });

  it('アイコンのアップロードに失敗しても、すでに成功した表示名の保存は巻き戻さない', async () => {
    uploadMyIcon.mockRejectedValue(new Error('upload failed'));

    await expect(
      performProfileUpdate(
        { name: '新しい名前', iconUrl: USER.iconUrl, newIconUri: NEW_ICON_URI },
        deps,
      ),
    ).rejects.toThrow('upload failed');

    const nameOnlyUpdate = { id: 'user-1', name: '新しい名前', iconUrl: USER.iconUrl };
    expect(useAuthStore.getState().currentUser).toEqual(nameOnlyUpdate);
    expect(updatePersistedUser).toHaveBeenCalledWith(nameOnlyUpdate);
  });

  it('送信に失敗したらストアも永続化も変えず、アイコンのアップロードも呼ばない', async () => {
    updateCurrentUser.mockRejectedValue(new Error('network error'));

    await expect(
      performProfileUpdate({ name: '新しい名前', iconUrl: '', newIconUri: NEW_ICON_URI }, deps),
    ).rejects.toThrow('network error');

    expect(uploadMyIcon).not.toHaveBeenCalled();
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

  it('アイコンのアップロード中にログアウトされていたら、アイコンの応答はストアへ書き戻さない', async () => {
    uploadMyIcon.mockImplementation(async () => {
      useAuthStore.getState().logout();
      return { id: 'user-1', name: '新しい名前', iconUrl: UPLOADED_ICON_URL };
    });

    await performProfileUpdate(
      { name: '新しい名前', iconUrl: USER.iconUrl, newIconUri: NEW_ICON_URI },
      deps,
    );

    // アイコンのアップロード開始前に表示名だけの保存はすでに反映済み。
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(updatePersistedUser).toHaveBeenCalledTimes(1);
    expect(updatePersistedUser).toHaveBeenCalledWith({
      id: 'user-1',
      name: '新しい名前',
      iconUrl: USER.iconUrl,
    });
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

  it('送信中に同じユーザーで再ログインしていたら、前の応答で上書きしない', async () => {
    const RELOGGED_USER = { ...USER, name: '再ログイン後の名前' };
    updateCurrentUser.mockImplementation(async () => {
      useAuthStore.getState().logout();
      bumpSessionGeneration();
      useAuthStore.setState({ currentUser: RELOGGED_USER });
      return { id: 'user-1', name: '新しい名前', iconUrl: '' };
    });

    await performProfileUpdate({ name: '新しい名前', iconUrl: '' }, deps);

    expect(useAuthStore.getState().currentUser).toEqual(RELOGGED_USER);
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

    await performProfileUpdate(
      { name: '新しい名前', iconUrl: USER.iconUrl, newIconUri: NEW_ICON_URI },
      deps,
    );

    const reviews = useReviewStore.getState().submittedReviews['spot-a'];
    expect(reviews.find((r) => r.id === 'r1')?.author).toEqual({
      id: USER.id,
      name: '新しい名前',
      iconUrl: UPLOADED_ICON_URL,
    });
    expect(reviews.find((r) => r.id === 'r2')?.author).toEqual({
      id: 'other-user',
      name: '他人',
      iconUrl: '',
    });
  });
});
