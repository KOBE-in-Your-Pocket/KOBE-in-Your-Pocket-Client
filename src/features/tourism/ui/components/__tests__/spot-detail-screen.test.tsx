import { render, screen } from '@testing-library/react-native';
import { ActivityIndicator, Text as MockText, View as MockView } from 'react-native';

import { SpotDetailScreen } from '../spot-detail-screen';

import type { Spot } from '../../../domain/spot';
import type { ReactNode } from 'react';

const mockSpot: Spot = {
  id: 'nankinmachi',
  name: '南京町',
  description: '神戸の中華街。',
  address: '兵庫県神戸市中央区栄町通',
  businessHours: '10:00 - 20:00',
  genre: 'gourmet',
  category: { label: 'グルメ' },
  media: { imageUrl: 'https://example.com/nankinmachi.jpg' },
  coordinates: { latitude: 34.6889, longitude: 135.1877 },
  rating: { value: 4.2 },
};

const mockUseSpotDetail = jest.fn();

jest.mock('../../styles/spot-detail.styles', () => ({
  styles: {
    container: {},
    centered: {},
  },
}));

jest.mock('../../../application/use-spot-detail', () => ({
  useSpotDetail: (spotId: string) => mockUseSpotDetail(spotId),
}));

jest.mock('../spot-detail', () => ({
  SpotDetailContent: ({ spot }: { spot: Spot }) => (
    <MockText>{`spot-detail-content:${spot.name}`}</MockText>
  ),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
}));

describe('SpotDetailScreen', () => {
  beforeEach(() => {
    mockUseSpotDetail.mockReturnValue({
      data: mockSpot,
      isPending: false,
      isError: false,
    });
  });

  afterEach(() => {
    mockUseSpotDetail.mockReset();
  });

  it('useSpotDetail に spotId を渡す', () => {
    render(<SpotDetailScreen spotId="nankinmachi" />);

    expect(mockUseSpotDetail).toHaveBeenCalledWith('nankinmachi');
  });

  it('取得中はローディング表示', () => {
    mockUseSpotDetail.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });

    render(<SpotDetailScreen spotId="nankinmachi" />);

    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByText('tourism.spotDetail.loadError')).toBeNull();
    expect(screen.queryByText('tourism.spotDetail.notFound')).toBeNull();
    expect(screen.queryByText(`spot-detail-content:${mockSpot.name}`)).toBeNull();
  });

  it('取得エラー時は loadError を表示する', () => {
    mockUseSpotDetail.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    });

    render(<SpotDetailScreen spotId="nankinmachi" />);

    expect(screen.getByText('tourism.spotDetail.loadError')).toBeTruthy();
    expect(screen.queryByText('tourism.spotDetail.notFound')).toBeNull();
    expect(screen.queryByText(`spot-detail-content:${mockSpot.name}`)).toBeNull();
  });

  it('スポット未検出時は notFound を表示する', () => {
    mockUseSpotDetail.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
    });

    render(<SpotDetailScreen spotId="unknown-spot" />);

    expect(screen.getByText('tourism.spotDetail.notFound')).toBeTruthy();
    expect(screen.queryByText('tourism.spotDetail.loadError')).toBeNull();
    expect(screen.queryByText(`spot-detail-content:${mockSpot.name}`)).toBeNull();
  });

  it('取得成功時は SpotDetailContent に spot を渡して表示する', () => {
    render(<SpotDetailScreen spotId="nankinmachi" />);

    expect(screen.getByText('spot-detail-content:南京町')).toBeTruthy();
    expect(screen.queryByText('tourism.spotDetail.loadError')).toBeNull();
    expect(screen.queryByText('tourism.spotDetail.notFound')).toBeNull();
  });
});
