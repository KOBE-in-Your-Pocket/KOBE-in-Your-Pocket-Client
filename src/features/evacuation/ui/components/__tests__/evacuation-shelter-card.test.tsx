import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  Text as MockText,
  View as MockView,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { EvacuationShelterCard } from '../evacuation-shelter-card';

import type { EvacuationShelter } from '../../../domain/evacuation-shelter';
import type { GeoCoordinates } from '@/shared/lib/geo';
import type { ReactNode } from 'react';

const shelter: EvacuationShelter = {
  id: 'shelter-1',
  name: '中央区役所',
  address: '神戸市中央区',
  coordinates: { latitude: 34.6826, longitude: 135.1863 },
  type: 'designated',
  facilityCategory: 'school',
  media: { imageUrl: 'https://example.com/a.jpg' },
  accessible: true,
  capacity: 500,
};

const currentLocation: GeoCoordinates = { latitude: 34.694722, longitude: 135.195833 };

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockConfirmOpenDirections = jest.fn();

// 距離計算は shared のユニットテストに委ね、ここでは表示分岐の検証に集中するため決め打ちにする。
jest.mock('@/shared/lib/geo', () => ({
  getDistanceKm: () => 1.2,
  formatDistanceKm: (km: number) => `${km} km`,
}));

jest.mock('@/shared/lib/directions', () => ({
  confirmOpenDirections: (...args: unknown[]) => mockConfirmOpenDirections(...args),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  BottomTabInset: 0,
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ text: '#000000', textSecondary: '#60646C', background: '#FFFFFF' }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
    <MockText style={style}>{children}</MockText>
  ),
  ThemedView: ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
    <MockView style={style}>{children}</MockView>
  ),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderCard(overrides: Partial<React.ComponentProps<typeof EvacuationShelterCard>> = {}) {
  const props = {
    shelter,
    currentLocation,
    onClose: jest.fn(),
    onDetail: jest.fn(),
    ...overrides,
  };
  render(<EvacuationShelterCard {...props} />);
  return props;
}

describe('EvacuationShelterCard', () => {
  beforeEach(() => {
    mockConfirmOpenDirections.mockClear();
  });

  describe('ピン選択時のカード表示', () => {
    it('避難所の名称・住所を表示する', () => {
      renderCard();

      expect(screen.getByText('中央区役所')).toBeTruthy();
      expect(screen.getByText('神戸市中央区')).toBeTruthy();
    });

    it('経路ボタンと詳細ボタンが存在する', () => {
      renderCard();

      expect(screen.getByLabelText('evacuation.shelterCard.navigate')).toBeTruthy();
      expect(screen.getByLabelText('evacuation.shelterCard.detail')).toBeTruthy();
    });
  });

  describe('距離表示', () => {
    it('現在地があるとき距離を表示する', () => {
      renderCard();

      expect(screen.getByText('1.2 km')).toBeTruthy();
    });

    it('現在地がないとき距離を表示しない', () => {
      renderCard({ currentLocation: null });

      expect(screen.queryByText('1.2 km')).toBeNull();
    });
  });

  describe('収容人数表示', () => {
    it('capacity が無い避難所は収容人数の行を表示しない', () => {
      renderCard({ shelter: { ...shelter, capacity: undefined } });

      expect(screen.queryByText('evacuation.list.capacity')).toBeNull();
    });

    it('capacity がある避難所は収容人数を表示する', () => {
      renderCard();

      expect(screen.getByText('evacuation.list.capacity')).toBeTruthy();
    });
  });

  describe('経路ボタン', () => {
    it('押すと現在地を起点に confirmOpenDirections を呼ぶ', () => {
      renderCard();

      fireEvent.press(screen.getByLabelText('evacuation.shelterCard.navigate'));

      expect(mockConfirmOpenDirections).toHaveBeenCalledTimes(1);
      expect(mockConfirmOpenDirections).toHaveBeenCalledWith(
        expect.any(Function),
        shelter.coordinates,
        { origin: currentLocation },
      );
    });

    it('現在地がなくても経路ボタンは押せ、origin なしで呼ぶ', () => {
      renderCard({ currentLocation: null });

      fireEvent.press(screen.getByLabelText('evacuation.shelterCard.navigate'));

      expect(mockConfirmOpenDirections).toHaveBeenCalledWith(
        expect.any(Function),
        shelter.coordinates,
        { origin: null },
      );
    });
  });

  describe('カードの操作', () => {
    it('詳細ボタンで onDetail を呼ぶ', () => {
      const { onDetail } = renderCard();

      fireEvent.press(screen.getByLabelText('evacuation.shelterCard.detail'));

      expect(onDetail).toHaveBeenCalledTimes(1);
    });

    it('閉じるボタンで onClose を呼ぶ', () => {
      const { onClose } = renderCard();

      fireEvent.press(screen.getByLabelText('evacuation.shelterCard.close'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
