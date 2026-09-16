import { fireEvent, render, screen } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';
import { Pressable as MockPressable, Text as MockThemedText, View as MockView } from 'react-native';

import { useMapModeStore } from '../../../store/use-map-mode-store';

import { MapModeToggle } from '../map-mode-toggle';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'map.modeToggle.tourism': '観光',
        'map.modeToggle.evacuation': '避難',
      };
      return labels[key] ?? key;
    },
  })),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  MODE_SELECTED_COLOR: { tourism: '#3B82F6', evacuation: '#EF4444' },
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    text: '#000000',
    textSecondary: '#60646C',
  }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: MockThemedText,
  SegmentedControl: ({
    segments,
    value,
    onChange,
  }: {
    segments: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <MockView accessibilityRole="tablist">
      {segments.map((seg) => (
        <MockPressable
          key={seg.value}
          onPress={() => onChange(seg.value)}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === seg.value }}
        >
          <MockThemedText>{seg.label}</MockThemedText>
        </MockPressable>
      ))}
    </MockView>
  ),
}));

const mockedUseTranslation = jest.mocked(useTranslation);

describe('MapModeToggle', () => {
  beforeEach(() => {
    useMapModeStore.setState({ mapMode: 'tourism' });
    mockedUseTranslation.mockReturnValue({
      t: (key: string) => {
        const labels: Record<string, string> = {
          'map.modeToggle.tourism': '観光',
          'map.modeToggle.evacuation': '避難',
        };
        return labels[key] ?? key;
      },
    } as ReturnType<typeof useTranslation>);
  });

  it('観光と避難のラベルを表示する', () => {
    render(<MapModeToggle />);

    expect(screen.getByText('観光')).toBeTruthy();
    expect(screen.getByText('避難')).toBeTruthy();
  });

  it('避難をタップすると mapMode が evacuation になる', () => {
    render(<MapModeToggle />);

    fireEvent.press(screen.getByText('避難'));

    expect(useMapModeStore.getState().mapMode).toBe('evacuation');
  });

  it('観光をタップすると mapMode が tourism になる', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });

    render(<MapModeToggle />);

    fireEvent.press(screen.getByText('観光'));

    expect(useMapModeStore.getState().mapMode).toBe('tourism');
  });

  it('i18n の t からラベルを表示する', () => {
    mockedUseTranslation.mockReturnValue({
      t: (key: string) => {
        const labels: Record<string, string> = {
          'map.modeToggle.tourism': 'Tourism',
          'map.modeToggle.evacuation': 'Evacuation',
        };
        return labels[key] ?? key;
      },
    } as ReturnType<typeof useTranslation>);

    render(<MapModeToggle />);

    expect(screen.getByText('Tourism')).toBeTruthy();
    expect(screen.getByText('Evacuation')).toBeTruthy();
  });
});
