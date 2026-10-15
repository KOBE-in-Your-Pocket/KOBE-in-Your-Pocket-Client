import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { useKindFilterStore } from '../../../store/use-kind-filter-store';
import { useScopeFilterStore } from '../../../store/use-scope-filter-store';
import { MannerFilterModal } from '../manner-filter-modal';

import type { ReactNode } from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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

describe('MannerFilterModal', () => {
  beforeEach(() => {
    useKindFilterStore.setState({ selectedKind: 'all' });
    useScopeFilterStore.setState({ selectedScope: 'all' });
  });

  it('カテゴリーと対象のセクションと全選択肢を表示する', () => {
    render(<MannerFilterModal visible onClose={jest.fn()} />);

    expect(screen.getByText('manner.filter.category')).toBeTruthy();
    expect(screen.getByText('manner.filter.target')).toBeTruthy();

    for (const key of ['all', 'rule', 'manner'] as const) {
      expect(screen.getByText(`manner.kindFilter.${key}`)).toBeTruthy();
    }
    for (const key of ['all', 'local', 'japan'] as const) {
      expect(screen.getByText(`manner.scopeFilter.${key}`)).toBeTruthy();
    }
  });

  it('カテゴリーの選択がストアに反映される', () => {
    render(<MannerFilterModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('manner.kindFilter.rule'));

    expect(useKindFilterStore.getState().selectedKind).toBe('rule');
  });

  it('対象の選択がストアに反映される', () => {
    render(<MannerFilterModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('manner.scopeFilter.japan'));

    expect(useScopeFilterStore.getState().selectedScope).toBe('japan');
  });

  it('「すべて」を選ぶとその軸の絞り込みが解除される', () => {
    useKindFilterStore.setState({ selectedKind: 'rule' });

    render(<MannerFilterModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('manner.kindFilter.all'));

    expect(useKindFilterStore.getState().selectedKind).toBe('all');
  });

  it('閉じるボタンで onClose が呼ばれる', () => {
    const onClose = jest.fn();
    render(<MannerFilterModal visible onClose={onClose} />);

    fireEvent.press(screen.getByLabelText('manner.filter.close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
