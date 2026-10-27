import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { useKindFilterStore } from '../../../store/use-kind-filter-store';
import { useScopeFilterStore } from '../../../store/use-scope-filter-store';
import { MannerFilterModal } from '../manner-filter-modal';

import type { ReactNode } from 'react';

// 本番と同様に、カテゴリー軸と対象軸の「全て」を同一文言（全て）にする。
// 恒等モックだと 2 つの「全て」が別キー扱いになり、アクセシビリティラベルの
// 重複（VoiceOver / TalkBack で区別できない問題）を検出できず隠れてしまうため。
jest.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'manner.filter.category': 'カテゴリー',
    'manner.filter.target': '対象',
    'manner.filter.title': '絞り込み',
    'manner.filter.close': '閉じる',
    'manner.kindFilter.all': '全て',
    'manner.kindFilter.rule': 'ルール',
    'manner.kindFilter.manner': 'マナー',
    'manner.scopeFilter.all': '全て',
    'manner.scopeFilter.local': '各所',
    'manner.scopeFilter.japan': '全国',
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

describe('MannerFilterModal', () => {
  beforeEach(() => {
    useKindFilterStore.setState({ selectedKind: 'all' });
    useScopeFilterStore.setState({ selectedScope: 'all' });
  });

  it('カテゴリーと対象のセクションと全選択肢を表示する', () => {
    render(<MannerFilterModal visible onClose={jest.fn()} />);

    expect(screen.getByText('カテゴリー')).toBeTruthy();
    expect(screen.getByText('対象')).toBeTruthy();

    // 「全て」は両軸に出るため 2 件。
    expect(screen.getAllByText('全て')).toHaveLength(2);
    for (const label of ['ルール', 'マナー', '各所', '全国']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('カテゴリーの選択がストアに反映される', () => {
    render(<MannerFilterModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('カテゴリー ルール'));

    expect(useKindFilterStore.getState().selectedKind).toBe('rule');
  });

  it('対象の選択がストアに反映される', () => {
    render(<MannerFilterModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('対象 全国'));

    expect(useScopeFilterStore.getState().selectedScope).toBe('japan');
  });

  it('「すべて」を選ぶとその軸の絞り込みが解除される', () => {
    useKindFilterStore.setState({ selectedKind: 'rule' });

    render(<MannerFilterModal visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('カテゴリー 全て'));

    expect(useKindFilterStore.getState().selectedKind).toBe('all');
  });

  it('両軸の「全て」はセクション名付きで一意に識別できる（同一文言でも区別可能）', () => {
    render(<MannerFilterModal visible onClose={jest.fn()} />);

    // 文言はどちらも「全て」だが、アクセシビリティラベルはセクション名付きで区別できる。
    const categoryAll = screen.getByLabelText('カテゴリー 全て');
    const scopeAll = screen.getByLabelText('対象 全て');

    expect(categoryAll).not.toBe(scopeAll);
  });

  it('閉じるボタンで onClose が呼ばれる', () => {
    const onClose = jest.fn();
    render(<MannerFilterModal visible onClose={onClose} />);

    fireEvent.press(screen.getByLabelText('閉じる'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
