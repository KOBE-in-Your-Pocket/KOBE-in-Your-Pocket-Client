import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable as MockPressable, Text as MockText } from 'react-native';

import type { Spot } from '../../../domain/spot';
import { FavoritesScreen } from '../favorites-screen';

import type { ReactNode } from 'react';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockCurrentUser = jest.fn();
const mockRefetch = jest.fn(() => Promise.resolve());
const mockFavoriteSpots = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    navigate: (...args: unknown[]) => mockNavigate(...args),
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => mockCanGoBack(),
  },
}));

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaView: View };
});

// index から読み込むと i18n の初期化まで走るため、使う部品だけ素の View / Text にする。
jest.mock('@/shared/ui', () => {
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ThemedText: Text, ThemedView: View };
});

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#666666' }),
}));

jest.mock('@/shared/lib/geo', () => ({
  formatDistanceKm: (km: number) => `${km}km`,
}));

jest.mock('@/features/user', () => ({
  useCurrentUser: () => mockCurrentUser(),
  SignInModal: ({ visible }: { visible: boolean; children?: ReactNode }) =>
    visible ? <MockText>sign-in-modal</MockText> : null,
}));

jest.mock('../../../application/use-favorite-spots', () => ({
  useFavoriteSpots: () => mockFavoriteSpots(),
}));

// 押したときの追加・削除は spot-favorite-button.test.tsx で確認済み。
jest.mock('../spot-favorite-button', () => ({
  SpotFavoriteButton: ({ spotId }: { spotId: string }) => (
    <MockPressable testID={`favorite-${spotId}`} accessibilityRole="button" />
  ),
}));

function makeSpot(id: string, name: string): Spot {
  return {
    id,
    name,
    genre: 'landmark',
    description: '',
    address: '',
    coordinates: { latitude: 34.68, longitude: 135.19 },
    businessHours: '9:00-21:00',
    category: { label: 'Landmark' },
    media: { imageUrl: 'https://example.com/a.jpg' },
  };
}

const USER = { id: 'user-1', name: '太郎', iconUrl: '' };

function favoriteSpots(overrides: Partial<ReturnType<typeof mockFavoriteSpots>> = {}) {
  return { data: [], isPending: false, isError: false, refetch: mockRefetch, ...overrides };
}

describe('FavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    mockCurrentUser.mockReturnValue(USER);
    mockFavoriteSpots.mockReturnValue(
      favoriteSpots({
        data: [makeSpot('spot-b', '布引の滝'), makeSpot('spot-a', '神戸ポートタワー')],
      }),
    );
  });

  it('お気に入りのスポットを、渡された順（登録の新しい順）に並べる', () => {
    render(<FavoritesScreen />);

    const names = screen
      .getAllByRole('button')
      .map((button) => button.props.accessibilityLabel)
      .filter((label) => label === '布引の滝' || label === '神戸ポートタワー');
    expect(names).toEqual(['布引の滝', '神戸ポートタワー']);
    expect(screen.getByTestId('favorite-spot-a')).toBeTruthy();
    expect(screen.getByTestId('favorite-spot-b')).toBeTruthy();
  });

  it('行を押すとそのスポットの観光詳細を開く', () => {
    render(<FavoritesScreen />);

    fireEvent.press(screen.getByLabelText('神戸ポートタワー'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tourism/[id]', params: { id: 'spot-a' } });
  });

  it('距離のバッジは出さない（この画面では現在地を取りに行かない）', () => {
    render(<FavoritesScreen />);

    expect(screen.queryByText(/km$/, { includeHiddenElements: true })).toBeNull();
  });

  it('0 件のときは案内を出し、ボタンで観光タブへ移る', () => {
    mockFavoriteSpots.mockReturnValue(favoriteSpots({ data: [] }));
    render(<FavoritesScreen />);

    expect(screen.getByText('tourism.favorite.list.empty')).toBeTruthy();
    expect(screen.getByText('tourism.favorite.list.emptyHint')).toBeTruthy();

    fireEvent.press(screen.getByText('tourism.favorite.list.browseSpots'));
    expect(mockNavigate).toHaveBeenCalledWith('/tourism');
  });

  it('未ログインのときはログインを案内し、押すとログインのモーダルを開く', () => {
    mockCurrentUser.mockReturnValue(null);
    render(<FavoritesScreen />);

    expect(screen.getByText('tourism.favorite.list.signInPrompt')).toBeTruthy();
    expect(screen.queryByText('sign-in-modal')).toBeNull();

    fireEvent.press(screen.getByText('tourism.favorite.list.signIn'));
    expect(screen.getByText('sign-in-modal')).toBeTruthy();
  });

  it('未ログインのときはお気に入りを取りに行かない', () => {
    mockCurrentUser.mockReturnValue(null);
    render(<FavoritesScreen />);

    expect(mockFavoriteSpots).not.toHaveBeenCalled();
  });

  it('読み込み中はくるくるを出し、案内は出さない', () => {
    mockFavoriteSpots.mockReturnValue(favoriteSpots({ data: undefined, isPending: true }));
    render(<FavoritesScreen />);

    expect(screen.queryByText('tourism.favorite.list.empty')).toBeNull();
    expect(screen.queryByLabelText('神戸ポートタワー')).toBeNull();
  });

  it('読み込みに失敗したらエラーを出し、再試行で取り直す', () => {
    mockFavoriteSpots.mockReturnValue(favoriteSpots({ data: undefined, isError: true }));
    render(<FavoritesScreen />);

    expect(screen.getByText('tourism.favorite.list.loadError')).toBeTruthy();
    fireEvent.press(screen.getByText('tourism.favorite.list.retry'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('戻るボタンで前の画面に戻る', () => {
    render(<FavoritesScreen />);

    fireEvent.press(screen.getByLabelText('common.back'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('戻り先が無いときは設定画面へ移る', () => {
    mockCanGoBack.mockReturnValue(false);
    render(<FavoritesScreen />);

    fireEvent.press(screen.getByLabelText('common.back'));

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/settings');
  });
});
