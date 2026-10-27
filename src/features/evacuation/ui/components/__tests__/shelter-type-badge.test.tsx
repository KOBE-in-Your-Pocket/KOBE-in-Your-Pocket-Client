import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import { SHELTER_TYPE_BADGE } from '../../styles/shelter-type-badge.styles';
import { ShelterTypeBadge } from '../shelter-type-badge';

import type { ReactNode } from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: ({ name, tintColor }: { name: { android: string }; tintColor: string }) => (
    <MockText>{`icon:${name.android}:${tintColor}`}</MockText>
  ),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

const mockUseThemeScheme = jest.fn(() => 'light');

jest.mock('@/shared/lib/theme', () => ({
  useThemeScheme: () => mockUseThemeScheme(),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
}));

describe('ShelterTypeBadge', () => {
  afterEach(() => {
    mockUseThemeScheme.mockReturnValue('light');
  });

  it.each(['emergency', 'designated', 'both'] as const)(
    '%s 区分はラベル・説明文と区分別の色・アイコンを出し分ける',
    (type) => {
      render(<ShelterTypeBadge type={type} />);

      // 文言: 区分ごとのラベルと、一言では分かりにくい区分を補う説明文を表示する。
      expect(screen.getByText(`evacuation.shelterDetail.typeBadge.${type}.label`)).toBeTruthy();
      expect(
        screen.getByText(`evacuation.shelterDetail.typeBadge.${type}.description`),
      ).toBeTruthy();

      // 配色・アイコン: 区分ごとに定義した色とアイコンで表示する。
      const { light, icon } = SHELTER_TYPE_BADGE[type];
      expect(screen.getByText(`icon:${icon.android}:${light.color}`)).toBeTruthy();
    },
  );

  it.each(['emergency', 'designated', 'both'] as const)(
    'ダークモードでは %s 区分をダーク用の配色で表示する',
    (type) => {
      mockUseThemeScheme.mockReturnValue('dark');

      render(<ShelterTypeBadge type={type} />);

      const { dark, icon } = SHELTER_TYPE_BADGE[type];
      expect(screen.getByText(`icon:${icon.android}:${dark.color}`)).toBeTruthy();
    },
  );

  it.each(['light', 'dark'] as const)('%s でも区分ごとに異なる色を割り当てている', (scheme) => {
    const colors = (['emergency', 'designated', 'both'] as const).map(
      (type) => SHELTER_TYPE_BADGE[type][scheme].color,
    );

    expect(new Set(colors).size).toBe(colors.length);
  });

  it('未知の区分ではバッジを表示しない（クラッシュしない）', () => {
    // バックエンドが想定外の値を返しても例外にならず、何も描画しないこと。
    const { toJSON } = render(<ShelterTypeBadge type={'unknown' as never} />);

    expect(toJSON()).toBeNull();
  });
});
