import { fireEvent, render, screen } from '@testing-library/react-native';

import { SpotFavoriteButton } from '../spot-favorite-button';

jest.mock('@/shared/config', () => ({
  get IS_USER_CONTENT_ENABLED() {
    return mockUserContentEnabled();
  },
}));

jest.mock('@/shared/store', () => ({
  useIsAdult: () => mockIsAdult(),
}));

jest.mock('@/features/user/application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

jest.mock('../../../application/use-favorites', () => ({
  useIsFavorite: (spotId: string) => mockIsFavorite(spotId),
}));

jest.mock('../../../application/use-toggle-favorite', () => ({
  useToggleFavorite: () => ({ mutate: mockMutate }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#60646C' }),
}));

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockUserContentEnabled = jest.fn();
const mockIsAdult = jest.fn();
const mockCurrentUser = jest.fn();
const mockIsFavorite = jest.fn();
const mockMutate = jest.fn();

const USER = { id: 'user-1', name: '太郎', iconUrl: '' };

describe('SpotFavoriteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserContentEnabled.mockReturnValue(true);
    mockIsAdult.mockReturnValue(true);
    mockCurrentUser.mockReturnValue(USER);
    mockIsFavorite.mockReturnValue(false);
  });

  it('未登録のスポットで押すと追加する', () => {
    render(<SpotFavoriteButton spotId="spot-a" />);

    fireEvent.press(screen.getByRole('button', { name: 'tourism.favorite.add' }));

    expect(mockIsFavorite).toHaveBeenCalledWith('spot-a');
    expect(mockMutate).toHaveBeenCalledWith({ spotId: 'spot-a', next: true });
  });

  it('お気に入り済みのスポットで押すと削除する', () => {
    mockIsFavorite.mockReturnValue(true);
    render(<SpotFavoriteButton spotId="spot-a" />);

    fireEvent.press(screen.getByRole('button', { name: 'tourism.favorite.remove' }));

    expect(mockMutate).toHaveBeenCalledWith({ spotId: 'spot-a', next: false });
  });

  it('未ログインなら押しても何もしない（ログインの案内は #796）', () => {
    mockCurrentUser.mockReturnValue(null);
    render(<SpotFavoriteButton spotId="spot-a" />);

    fireEvent.press(screen.getByRole('button'));

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('ユーザー投稿機能が無効なら表示しない', () => {
    mockUserContentEnabled.mockReturnValue(false);
    render(<SpotFavoriteButton spotId="spot-a" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('18 歳未満なら表示しない（アカウントを作れないため）', () => {
    mockIsAdult.mockReturnValue(false);
    render(<SpotFavoriteButton spotId="spot-a" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
