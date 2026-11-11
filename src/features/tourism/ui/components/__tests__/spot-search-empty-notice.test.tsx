import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import { useSpotSearchStore } from '../../../store/use-spot-search-store';
import { SpotSearchEmptyNotice } from '../spot-search-empty-notice';

import type { ReactNode } from 'react';

const mockUseSpots = jest.fn();

jest.mock('../../../application/use-spots', () => ({
  useSpots: () => mockUseSpots(),
}));

jest.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'map.search.noResults': '見つかりませんでした',
  };
  return {
    useTranslation: () => ({ t: (key: string) => translations[key] ?? key }),
  };
});

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#666666', backgroundElement: '#F0F0F3' }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
}));

const mockSpots = [
  { id: 'spot-1', name: 'スポットA', coordinates: { latitude: 34.7, longitude: 135.2 } },
];

describe('SpotSearchEmptyNotice', () => {
  beforeEach(() => {
    useSpotSearchStore.setState({ keyword: '' });
    mockUseSpots.mockReturnValue({ data: mockSpots, isPending: false, isError: false });
  });

  it('キーワードが空のときは表示しない', () => {
    render(<SpotSearchEmptyNotice />);

    expect(screen.queryByText('見つかりませんでした')).toBeNull();
  });

  it('キーワードに一致するスポットがあるときは表示しない', () => {
    useSpotSearchStore.setState({ keyword: 'スポットA' });
    render(<SpotSearchEmptyNotice />);

    expect(screen.queryByText('見つかりませんでした')).toBeNull();
  });

  it('キーワードに一致するスポットが無いときは案内を表示する', () => {
    useSpotSearchStore.setState({ keyword: '北野' });
    render(<SpotSearchEmptyNotice />);

    expect(screen.getByText('見つかりませんでした')).toBeTruthy();
  });

  it('読み込み中（isPending）は0件でも案内を表示しない', () => {
    mockUseSpots.mockReturnValue({ data: undefined, isPending: true });
    useSpotSearchStore.setState({ keyword: '北野' });
    render(<SpotSearchEmptyNotice />);

    expect(screen.queryByText('見つかりませんでした')).toBeNull();
  });

  it('取得に失敗した（isError）ときは0件でも案内を表示しない', () => {
    mockUseSpots.mockReturnValue({ data: undefined, isPending: false, isError: true });
    useSpotSearchStore.setState({ keyword: '北野' });
    render(<SpotSearchEmptyNotice />);

    expect(screen.queryByText('見つかりませんでした')).toBeNull();
  });
});
