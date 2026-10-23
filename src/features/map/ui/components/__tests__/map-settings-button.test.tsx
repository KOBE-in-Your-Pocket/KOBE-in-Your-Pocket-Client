import { fireEvent, render, screen } from '@testing-library/react-native';

import { MapSettingsButton } from '../map-settings-button';

jest.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'map.settings.open': '設定を開く',
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
    backgroundElement: '#F0F0F3',
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('MapSettingsButton', () => {
  it('タップで onPress が呼ばれる', () => {
    const onPress = jest.fn();
    render(<MapSettingsButton onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('設定を開く'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
