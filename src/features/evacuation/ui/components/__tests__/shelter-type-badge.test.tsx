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

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
}));

describe('ShelterTypeBadge', () => {
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
      const { color, icon } = SHELTER_TYPE_BADGE[type];
      expect(screen.getByText(`icon:${icon.android}:${color}`)).toBeTruthy();
    },
  );

  it('区分ごとに異なる色を割り当てている', () => {
    const colors = (['emergency', 'designated', 'both'] as const).map(
      (type) => SHELTER_TYPE_BADGE[type].color,
    );

    expect(new Set(colors).size).toBe(colors.length);
  });
});
