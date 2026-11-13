import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Pressable as MockPressable, Text as MockText } from 'react-native';

import type { Spot } from '../../../domain/spot';
import { SpotList } from '../spot-list';

const mockPush = jest.fn();
const mockFavoritePress = jest.fn();
const mockCoords = jest.fn<{ latitude: number; longitude: number } | null, []>(() => null);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// index から読み込むと i18n の初期化まで走るため、一覧で使う部品だけ素の View / Text にする。
jest.mock('@/shared/ui', () => {
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ThemedText: Text, ThemedView: View };
});

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#666666' }),
}));

jest.mock('@/shared/lib/geo', () => ({
  useCurrentLocation: () => ({ coords: mockCoords() }),
  getDistanceKm: () => 1.2,
  formatDistanceKm: (km: number) => `${km}km`,
}));

jest.mock('../genre-filter', () => ({
  GenreFilter: () => null,
}));

const spots: Spot[] = [
  {
    id: 'spot-a',
    name: '神戸ポートタワー',
    genre: 'landmark',
    description: '神戸のシンボル',
    address: '神戸市中央区',
    coordinates: { latitude: 34.68, longitude: 135.19 },
    businessHours: '9:00-21:00',
    category: { label: 'Landmark' },
    media: { imageUrl: 'https://example.com/a.jpg' },
  },
  {
    id: 'spot-b',
    name: '布引の滝',
    genre: 'nature',
    description: '日本三大神滝のひとつ',
    address: '神戸市中央区',
    coordinates: { latitude: 34.71, longitude: 135.19 },
    businessHours: '終日',
    category: { label: 'Nature' },
    media: { imageUrl: 'https://example.com/b.jpg' },
  },
];

jest.mock('../../../application/use-filtered-spots', () => ({
  useFilteredSpots: () => ({
    data: spots,
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

// 押したときの追加・削除や未ログイン時の案内は spot-favorite-button.test.tsx で確認済み。
// ここでは、各行にどのスポットのマークをどの見た目で置いているかだけを確かめる。
jest.mock('../spot-favorite-button', () => ({
  SpotFavoriteButton: ({ spotId, variant }: { spotId: string; variant?: string }) => (
    <MockPressable
      testID={`favorite-${spotId}`}
      accessibilityRole="button"
      onPress={() => mockFavoritePress(spotId)}
    >
      <MockText>{`${spotId}:${variant}`}</MockText>
    </MockPressable>
  ),
}));

describe('SpotList', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockFavoritePress.mockClear();
    mockCoords.mockReturnValue(null);
  });

  it('各行に、その行のスポットのお気に入りマークを画像の上の見た目で表示する', () => {
    render(<SpotList />);

    expect(screen.getByText('spot-a:overlay')).toBeTruthy();
    expect(screen.getByText('spot-b:overlay')).toBeTruthy();
  });

  it('お気に入りマークを押すとそのスポットの処理が呼ばれ、画面は移らない', () => {
    render(<SpotList />);

    fireEvent.press(screen.getByTestId('favorite-spot-b'));

    expect(mockFavoritePress).toHaveBeenCalledWith('spot-b');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('行・お気に入り・経路を入れ子にせず、それぞれ独立したボタンとして置く', () => {
    // Pressable の中に置いたボタンには VoiceOver・TalkBack で移動できないため。
    render(<SpotList />);

    const row = screen.getByLabelText('神戸ポートタワー');

    expect(within(row).queryByTestId('favorite-spot-a')).toBeNull();
    expect(within(row).queryByLabelText('tourism.spotList.routeButton')).toBeNull();
    // within は行そのものも含めて探すので、見つかるボタンは行だけのはず。
    expect(within(row).queryAllByRole('button')).toEqual([row]);
  });

  it('現在地があるときは、距離のバッジとお気に入りマークの両方を表示する', () => {
    mockCoords.mockReturnValue({ latitude: 34.69, longitude: 135.19 });
    render(<SpotList />);

    expect(screen.getAllByText('1.2km', { includeHiddenElements: true })).toHaveLength(2);
    expect(screen.getByText('spot-a:overlay')).toBeTruthy();
  });

  it('距離のバッジは読み上げでは単独の要素にしない（今までどおり行の一部として扱う）', () => {
    mockCoords.mockReturnValue({ latitude: 34.69, longitude: 135.19 });
    render(<SpotList />);

    expect(screen.queryByText('1.2km')).toBeNull();
  });

  it('行を押すとそのスポットの詳細へ移る', () => {
    render(<SpotList />);

    fireEvent.press(screen.getByLabelText('神戸ポートタワー'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/tourism/[id]',
      params: { id: 'spot-a' },
    });
  });

  it('「経路」を押すとそのスポットを選んだ状態で地図へ移る', () => {
    render(<SpotList />);

    fireEvent.press(screen.getAllByLabelText('tourism.spotList.routeButton')[0]);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/map',
      params: { spotId: 'spot-a', requestedAt: expect.any(String) },
    });
  });
});
