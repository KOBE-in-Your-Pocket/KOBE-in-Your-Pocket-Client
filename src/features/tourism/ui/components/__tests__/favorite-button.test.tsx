import { fireEvent, render, screen } from '@testing-library/react-native';

import { FavoriteButton } from '../favorite-button';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#60646C' }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: (props: Record<string, unknown>) => mockSymbolView(props),
}));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockSymbolView = jest.fn((_props: Record<string, unknown>) => null);

function lastSymbolProps() {
  return mockSymbolView.mock.calls.at(-1)?.[0] as { name: { ios: string }; tintColor: string };
}

describe('FavoriteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未登録なら「お気に入りに追加」のボタンで、線だけのハートを出す', () => {
    render(<FavoriteButton isFavorite={false} onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'tourism.favorite.add' })).toBeTruthy();
    expect(lastSymbolProps().name.ios).toBe('heart');
  });

  it('お気に入り済みなら「お気に入りから削除」のボタンで、塗りつぶしのハートを出す', () => {
    render(<FavoriteButton isFavorite onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'tourism.favorite.remove' })).toBeTruthy();
    expect(lastSymbolProps().name.ios).toBe('heart.fill');
  });

  it('状態で色も変える（Android でハートの形が同じに見えても区別できるように）', () => {
    const { rerender } = render(<FavoriteButton isFavorite={false} onPress={jest.fn()} />);
    const inactiveColor = lastSymbolProps().tintColor;

    rerender(<FavoriteButton isFavorite onPress={jest.fn()} />);

    expect(lastSymbolProps().tintColor).not.toBe(inactiveColor);
  });

  it('押すと onPress が呼ばれる', () => {
    const onPress = jest.fn();
    render(<FavoriteButton isFavorite={false} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
