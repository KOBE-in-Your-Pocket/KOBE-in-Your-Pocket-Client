import { fireEvent, render, screen } from '@testing-library/react-native';

import { useSpotSearchStore } from '../../../store/use-spot-search-store';
import { SpotSearchBar } from '../spot-search-bar';

jest.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'map.search.placeholder': '観光スポットを検索',
    'map.search.clear': '検索をクリア',
  };
  return {
    useTranslation: () => ({ t: (key: string) => translations[key] ?? key }),
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: () => null,
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({
    text: '#000000',
    textSecondary: '#666666',
    backgroundElement: '#F0F0F3',
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('SpotSearchBar', () => {
  beforeEach(() => {
    useSpotSearchStore.setState({ keyword: '' });
  });

  it('入力すると store の keyword が更新される', () => {
    render(<SpotSearchBar />);

    fireEvent.changeText(screen.getByPlaceholderText('観光スポットを検索'), '北野');

    expect(useSpotSearchStore.getState().keyword).toBe('北野');
  });

  it('keyword が空のときは × ボタンを表示しない', () => {
    render(<SpotSearchBar />);

    expect(screen.queryByLabelText('検索をクリア')).toBeNull();
  });

  it('× ボタンをタップすると keyword が空になる', () => {
    useSpotSearchStore.setState({ keyword: '北野' });
    render(<SpotSearchBar />);

    fireEvent.press(screen.getByLabelText('検索をクリア'));

    expect(useSpotSearchStore.getState().keyword).toBe('');
  });
});
