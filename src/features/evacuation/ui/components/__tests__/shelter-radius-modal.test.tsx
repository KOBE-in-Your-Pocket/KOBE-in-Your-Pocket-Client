import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { ShelterRadiusModal } from '../shelter-radius-modal';

import type { ReactNode } from 'react';

jest.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'evacuation.radiusFilter.title': '表示範囲',
    'evacuation.radiusFilter.close': '閉じる',
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
});
