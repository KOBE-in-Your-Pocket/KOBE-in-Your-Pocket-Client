import { fireEvent, render, screen } from '@testing-library/react-native';
import { processColor } from 'react-native';

import { FavoriteButton } from '../favorite-button';
import { FAVORITE_ACTIVE_COLOR } from '../../styles/favorite-button.styles';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ textSecondary: '#60646C' }),
}));

const OUTLINED_HEART = require('@/assets/images/favorites/heart-outline.png');
const FILLED_HEART = require('@/assets/images/favorites/heart-filled.png');

function iconProps() {
  return screen.getByTestId('favorite-icon').props as { source: unknown; tintColor: string };
}

describe('FavoriteButton', () => {
  it('未登録なら「お気に入りに追加」のボタンで、線だけのハートを出す', () => {
    render(<FavoriteButton isFavorite={false} onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'tourism.favorite.add' })).toBeTruthy();
    // expo-image は source を配列に包むため、配列として比べる。
    expect(iconProps().source).toEqual([OUTLINED_HEART]);
  });

  it('お気に入り済みなら「お気に入りから削除」のボタンで、塗りつぶしのハートを出す', () => {
    render(<FavoriteButton isFavorite onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'tourism.favorite.remove' })).toBeTruthy();
    expect(iconProps().source).toEqual([FILLED_HEART]);
  });

  it('状態で塗りつぶしと枠線のハート画像を切り替える', () => {
    const { rerender } = render(<FavoriteButton isFavorite={false} onPress={jest.fn()} />);
    const outlineSource = iconProps().source;

    rerender(<FavoriteButton isFavorite onPress={jest.fn()} />);

    expect(iconProps().source).not.toEqual(outlineSource);
  });

  it('お気に入り済みはアクティブ色、未登録は別の色で着色する', () => {
    const { rerender } = render(<FavoriteButton isFavorite={false} onPress={jest.fn()} />);
    const inactiveColor = iconProps().tintColor;

    rerender(<FavoriteButton isFavorite onPress={jest.fn()} />);

    // expo-image は tintColor を処理済みの数値にするため、processColor を通して比べる。
    expect(iconProps().tintColor).toBe(processColor(FAVORITE_ACTIVE_COLOR));
    expect(iconProps().tintColor).not.toBe(inactiveColor);
  });

  it('押すと onPress が呼ばれる', () => {
    const onPress = jest.fn();
    render(<FavoriteButton isFavorite={false} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
