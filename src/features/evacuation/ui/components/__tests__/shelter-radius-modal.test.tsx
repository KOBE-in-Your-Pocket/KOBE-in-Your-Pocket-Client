import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { useShelterRadiusStore } from '../../../store/use-shelter-radius-store';
import { ShelterRadiusModal } from '../shelter-radius-modal';

import type { ReactNode } from 'react';

jest.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'evacuation.radiusFilter.title': '表示範囲',
    'evacuation.radiusFilter.close': '閉じる',
    'evacuation.radiusFilter.options.1km': '1km',
    'evacuation.radiusFilter.options.3km': '3km',
    'evacuation.radiusFilter.options.5km': '5km',
    'evacuation.radiusFilter.options.unlimited': '無制限',
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
  useThemeScheme: () => 'light',
  useTheme: () => ({
    text: '#000000',
    textSecondary: '#60646C',
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
}));

describe('ShelterRadiusModal', () => {
  beforeEach(() => {
    useShelterRadiusStore.setState({ selectedRadiusKm: 1 });
  });

  it('表示中はタイトルを表示する', () => {
    render(<ShelterRadiusModal visible onClose={jest.fn()} />);

    expect(screen.getByText('表示範囲')).toBeTruthy();
  });

  it('閉じるボタンで onClose が呼ばれる', () => {
    const onClose = jest.fn();
    render(<ShelterRadiusModal visible onClose={onClose} />);

    fireEvent.press(screen.getByLabelText('閉じる'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('半径の選択肢（1km/3km/5km/無制限）を表示する', () => {
    render(<ShelterRadiusModal visible onClose={jest.fn()} />);

    for (const label of ['1km', '3km', '5km', '無制限']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('選択肢をタップするとストアに反映される', () => {
    render(<ShelterRadiusModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('3km'));

    expect(useShelterRadiusStore.getState().selectedRadiusKm).toBe(3);
  });

  it('「無制限」をタップすると null が反映される', () => {
    render(<ShelterRadiusModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('無制限'));

    expect(useShelterRadiusStore.getState().selectedRadiusKm).toBeNull();
  });

  it('選択中の半径は radio の selected 状態になる', () => {
    useShelterRadiusStore.setState({ selectedRadiusKm: 5 });

    render(<ShelterRadiusModal visible onClose={jest.fn()} />);

    expect(screen.getByLabelText('5km').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('1km').props.accessibilityState).toEqual({ selected: false });
  });
});
