import { fireEvent, render, screen } from '@testing-library/react-native';
import { View as MockView } from 'react-native';

import { ShelterImage } from '../shelter-image';

import type { ShelterFacilityCategory } from '../../../domain/evacuation-shelter';

const CATEGORY_ICONS: Record<ShelterFacilityCategory, string> = {
  government: 'building.columns.fill',
  school: 'graduationcap.fill',
  park: 'tree.fill',
  gymnasium: 'figure.basketball',
};

// onError を検証するため、押すと onError を呼ぶ簡易モックにする。source.uri を testID に露出する。
jest.mock('expo-image', () => {
  const { Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Image: ({ source, onError }: { source: { uri: string }; onError?: () => void }) => (
      <Pressable testID={`image-${source.uri}`} onPress={onError} />
    ),
  };
});

// アイコン名の受け渡しだけ検証できれば十分なので、name を testID として露出する軽量モックにする。
jest.mock('expo-symbols', () => ({
  SymbolView: ({ name }: { name: { ios: string } }) => <MockView testID={`symbol-${name.ios}`} />,
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ backgroundSelected: '#E0E1E6', textSecondary: '#60646C' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ShelterImage', () => {
  it.each(Object.entries(CATEGORY_ICONS) as [ShelterFacilityCategory, string][])(
    'imageUrl が空のとき %s カテゴリのアイコンをプレースホルダとして表示する',
    (facilityCategory, iconName) => {
      render(<ShelterImage imageUrl="" facilityCategory={facilityCategory} style={{}} />);

      expect(screen.getByTestId(`symbol-${iconName}`)).toBeTruthy();
      expect(screen.queryByTestId(/^image-/)).toBeNull();
    },
  );

  it('プレースホルダの accessibilityLabel はカテゴリの翻訳キーになる', () => {
    render(<ShelterImage imageUrl="" facilityCategory="school" style={{}} />);

    expect(screen.getByLabelText('evacuation.list.category.school')).toBeTruthy();
  });

  it('imageUrl が非空のとき画像を表示する', () => {
    render(
      <ShelterImage imageUrl="https://example.com/a.jpg" facilityCategory="park" style={{}} />,
    );

    expect(screen.getByTestId('image-https://example.com/a.jpg')).toBeTruthy();
    expect(screen.queryByTestId(/^symbol-/)).toBeNull();
  });

  it('画像の読み込みに失敗するとプレースホルダに切り替わる', () => {
    render(
      <ShelterImage
        imageUrl="https://example.com/broken.jpg"
        facilityCategory="gymnasium"
        style={{}}
      />,
    );

    fireEvent.press(screen.getByTestId('image-https://example.com/broken.jpg'));

    expect(screen.getByTestId(`symbol-${CATEGORY_ICONS.gymnasium}`)).toBeTruthy();
    expect(screen.queryByTestId(/^image-/)).toBeNull();
  });
});
