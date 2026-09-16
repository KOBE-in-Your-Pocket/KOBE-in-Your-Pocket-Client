import { render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView, type StyleProp, type TextStyle } from 'react-native';

import { KindBadge } from '../kind-badge';

import type { ReactNode } from 'react';

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
    <MockText style={style}>{children}</MockText>
  ),
}));

// アイコン名の受け渡しだけ検証できれば十分なので、name を testID として露出する軽量モックにする。
jest.mock('expo-symbols', () => ({
  SymbolView: ({ name }: { name: { ios: string } }) => <MockView testID={`symbol-${name.ios}`} />,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('KindBadge', () => {
  describe('マナー / ルールの表示分岐', () => {
    it('マナーはマナーのラベルと手のアイコンを表示する', () => {
      render(<KindBadge kind="manner" />);

      expect(screen.getByText('manner.kind.manner')).toBeTruthy();
      expect(screen.getByTestId('symbol-hand.raised.fill')).toBeTruthy();
    });

    it('ルールはルールのラベルと警告アイコンを表示する', () => {
      render(<KindBadge kind="rule" />);

      expect(screen.getByText('manner.kind.rule')).toBeTruthy();
      expect(screen.getByTestId('symbol-exclamationmark.triangle.fill')).toBeTruthy();
    });
  });

  describe('アクセシビリティ', () => {
    it('分類ラベルをアクセシビリティラベルに設定する', () => {
      render(<KindBadge kind="rule" />);

      expect(screen.getByLabelText('manner.kind.rule')).toBeTruthy();
    });
  });
});
