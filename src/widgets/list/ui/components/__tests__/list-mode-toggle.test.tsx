import { fireEvent, render, screen } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';
import { Pressable as MockPressable, Text as MockThemedText, View as MockView } from 'react-native';

import { useListModeStore } from '../../../store/use-list-mode-store';

import { ListModeToggle } from '../list-mode-toggle';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'list.modeToggle.tourism': 'スポット',
        'list.modeToggle.evacuation': '避難所',
      };
      return labels[key] ?? key;
    },
  })),
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

describe('ListModeToggle', () => {
  beforeEach(() => {
    useListModeStore.setState({ listMode: 'tourism' });
    mockedUseTranslation.mockReturnValue({
      t: (key: string) => {
        const labels: Record<string, string> = {
          'list.modeToggle.tourism': 'スポット',
          'list.modeToggle.evacuation': '避難所',
        };
        return labels[key] ?? key;
      },
    } as ReturnType<typeof useTranslation>);
  });

  it('スポットと避難所のラベルを表示する', () => {
    render(<ListModeToggle />);

    expect(screen.getByText('スポット')).toBeTruthy();
    expect(screen.getByText('避難所')).toBeTruthy();
  });

  it('避難所をタップすると listMode が evacuation になる', () => {
    render(<ListModeToggle />);

    fireEvent.press(screen.getByText('避難所'));

    expect(useListModeStore.getState().listMode).toBe('evacuation');
  });

  it('スポットをタップすると listMode が tourism になる', () => {
    useListModeStore.setState({ listMode: 'evacuation' });

    render(<ListModeToggle />);

    fireEvent.press(screen.getByText('スポット'));

    expect(useListModeStore.getState().listMode).toBe('tourism');
  });
});
