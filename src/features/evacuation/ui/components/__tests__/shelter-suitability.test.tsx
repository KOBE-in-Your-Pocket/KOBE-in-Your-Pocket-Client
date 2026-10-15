import { render, screen } from '@testing-library/react-native';
import { Text as MockText, type StyleProp, type TextStyle } from 'react-native';

import { ShelterSuitabilityChips, ShelterSuitabilityList } from '../shelter-suitability';

import type { ShelterSuitabilityByDisaster } from '../../../domain/evacuation-shelter';
import type { ReactNode } from 'react';

// 色の受け渡しを検証できるよう、tintColor を testID に露出する軽量モックにする。
jest.mock('expo-symbols', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    SymbolView: ({ name, tintColor }: { name: { ios: string }; tintColor: string }) => (
      <View testID={`symbol-${name.ios}-${tintColor}`} />
    ),
  };
});

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ text: '#000000', textSecondary: '#60646C', background: '#FFFFFF' }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
    <MockText style={style}>{children}</MockText>
  ),
}));

// 読み上げラベルの組み立てを検証するため、補間値を含めて返す。
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { disaster: string; status: string }) =>
      options ? `${options.disaster} = ${options.status}` : key,
  }),
}));

const SUITABILITY: ShelterSuitabilityByDisaster = {
  landslide: 'conditional',
  flood: 'suitable',
  tsunami: 'unsuitable',
  'large-fire': 'not-applicable',
};

describe('ShelterSuitabilityList', () => {
  it('見出しと 4 種別すべての適否を文言で表示する', () => {
    render(<ShelterSuitabilityList suitability={SUITABILITY} />);

    expect(screen.getByText('evacuation.suitability.title')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'evacuation.disasterType.landslide = evacuation.suitability.conditional',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('evacuation.disasterType.flood = evacuation.suitability.suitable'),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('evacuation.disasterType.tsunami = evacuation.suitability.unsuitable'),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        'evacuation.disasterType.large-fire = evacuation.suitability.not-applicable',
      ),
    ).toBeTruthy();
    expect(screen.getByText('evacuation.suitability.suitable')).toBeTruthy();
  });

  it('値の無い種別は「対象外」ではなく「情報なし」として表示する', () => {
    render(<ShelterSuitabilityList suitability={{ flood: 'suitable' }} />);

    expect(screen.getAllByText('evacuation.suitability.unknown')).toHaveLength(3);
    expect(screen.queryByText('evacuation.suitability.not-applicable')).toBeNull();
  });

  it('適否ごとに色付きのアイコンを出し、対象外はテーマの補助色にする', () => {
    render(<ShelterSuitabilityList suitability={SUITABILITY} />);

    expect(screen.getByTestId('symbol-checkmark.circle.fill-#16A34A')).toBeTruthy();
    expect(screen.getByTestId('symbol-exclamationmark.triangle.fill-#D97706')).toBeTruthy();
    expect(screen.getByTestId('symbol-xmark.circle.fill-#DC2626')).toBeTruthy();
    expect(screen.getByTestId('symbol-minus.circle-#60646C')).toBeTruthy();
  });

  it('適否の情報が無い避難所では欄ごと表示しない', () => {
    render(<ShelterSuitabilityList suitability={undefined} />);

    expect(screen.queryByText('evacuation.suitability.title')).toBeNull();
  });
});

describe('ShelterSuitabilityChips', () => {
  it('4 種別のチップを出し、読み上げでは適否まで読む', () => {
    render(<ShelterSuitabilityChips suitability={SUITABILITY} />);

    expect(screen.getByText('evacuation.disasterType.landslide')).toBeTruthy();
    expect(screen.getByText('evacuation.disasterType.large-fire')).toBeTruthy();
    expect(
      screen.getByLabelText('evacuation.disasterType.flood = evacuation.suitability.suitable'),
    ).toBeTruthy();
  });

  it('適否の情報が無い避難所では何も表示しない', () => {
    render(<ShelterSuitabilityChips suitability={undefined} />);

    expect(screen.queryByText(/evacuation\.disasterType/)).toBeNull();
  });
});
