import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable as MockPressable, Text as MockText } from 'react-native';

import type { Spot } from '@/features/tourism';

import { SpotCard } from '../spot-card';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('expo-image', () => ({
  Image: () => null,
}));

// index から読み込むと i18n の初期化まで走るため、カードで使う部品だけ素の View / Text にする。
jest.mock('@/shared/ui', () => {
  const { Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { ThemedText: Text, ThemedView: View };
});

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#666666' }),
}));

// 押したときの追加・削除や未ログイン時の案内は spot-favorite-button.test.tsx で確認済み。
// ここでは、どのスポットのマークをどの見た目で置いているかだけを確かめる。
const mockFavoritePress = jest.fn();
jest.mock('@/features/tourism', () => ({
  SpotFavoriteButton: ({ spotId, variant }: { spotId: string; variant?: string }) => (
    <MockPressable testID="spot-favorite-button" onPress={() => mockFavoritePress(spotId)}>
      <MockText>{`${spotId}:${variant}`}</MockText>
    </MockPressable>
  ),
}));

const spot: Spot = {
  id: 'spot-a',
  name: '神戸ポートタワー',
  genre: 'landmark',
  description: '神戸のシンボル',
  address: '神戸市中央区',
  coordinates: { latitude: 34.68, longitude: 135.19 },
  businessHours: '9:00-21:00',
  category: { label: 'Landmark' },
  media: { imageUrl: 'https://example.com/a.jpg' },
};

function renderCard() {
  const handlers = { onClose: jest.fn(), onDetail: jest.fn(), onNavigate: jest.fn() };
  render(<SpotCard spot={spot} distanceKm={1.2} {...handlers} />);
  return handlers;
}

describe('SpotCard', () => {
  beforeEach(() => {
    mockFavoritePress.mockClear();
  });

  it('選んだスポットのお気に入りマークを、画像の上の見た目で表示する', () => {
    renderCard();

    expect(screen.getByText('spot-a:overlay')).toBeTruthy();
  });

  it('お気に入りマークを押しても、閉じる・詳細・経路の処理は動かない', () => {
    const handlers = renderCard();

    fireEvent.press(screen.getByTestId('spot-favorite-button'));

    expect(mockFavoritePress).toHaveBeenCalledWith('spot-a');
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(handlers.onDetail).not.toHaveBeenCalled();
    expect(handlers.onNavigate).not.toHaveBeenCalled();
  });

  it('閉じるボタンを押すと onClose が呼ばれる', () => {
    const handlers = renderCard();

    fireEvent.press(screen.getByLabelText('map.spotCard.close'));

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it('「詳細を見る」「経路案内」を押すとそれぞれの処理が呼ばれる', () => {
    const handlers = renderCard();

    fireEvent.press(screen.getByLabelText('map.spotCard.detail'));
    fireEvent.press(screen.getByLabelText('map.spotCard.navigate'));

    expect(handlers.onDetail).toHaveBeenCalledTimes(1);
    expect(handlers.onNavigate).toHaveBeenCalledTimes(1);
  });
});
