import '@testing-library/jest-native/extend-expect';

import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import { TabButton } from '../tab-button';

import { TAB_DEFS } from '../../tab-bar-config';

import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

// styles が参照する Spacing を最小モック（@/shared/config 経由の CSS 読み込みを避ける）。
jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

// テーマ連動の色を検証するため useTheme を差し替え、ライト / ダークのトークンを注入できるようにする。
const mockUseTheme = jest.fn();
jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => mockUseTheme(),
}));

// @/shared/ui バレルは Reanimated / react-native-maps 等を巻き込むため、
// ラベル表示に必要な ThemedText だけを style を通す軽量スタブへ差し替える。
jest.mock('@/shared/ui', () => ({
  ThemedText: ({
    children,
    style,
    ...rest
  }: {
    children?: ReactNode;
    style?: StyleProp<TextStyle>;
  }) => (
    <MockText style={style} {...rest}>
      {children}
    </MockText>
  ),
}));

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

const SYMBOL = TAB_DEFS[0].symbol;
const LIGHT = { primary: '#208AEF', textSecondary: '#60646C' };
const DARK = { primary: '#4DA3F5', textSecondary: '#B0B4BA' };

describe('TabButton', () => {
  afterEach(() => mockUseTheme.mockReset());

  it('isFocused の真偽で太字とテーマの文字色（primary / textSecondary）が切り替わる', () => {
    mockUseTheme.mockReturnValue(LIGHT);

    const { rerender } = render(
      <TabButton isFocused symbol={SYMBOL}>
        ホーム
      </TabButton>,
    );

    // フォーカス: tabLabelFocused（太字 800）＋ テーマの primary 色。サイズは固定のまま。
    // 期待値はリテラルで固定し、tabLabel と tabLabelFocused が同値へ退行した場合も検知する。
    expect(screen.getByText('ホーム')).toHaveStyle({
      fontSize: 11,
      fontWeight: '800',
      color: LIGHT.primary,
    });

    rerender(
      <TabButton isFocused={false} symbol={SYMBOL}>
        ホーム
      </TabButton>,
    );

    // 非フォーカス: 通常サイズ（11 / weight 600）＋ テーマの textSecondary 色。
    expect(screen.getByText('ホーム')).toHaveStyle({
      fontSize: 11,
      fontWeight: '600',
      color: LIGHT.textSecondary,
    });
  });

  it('ダークテーマではダークのトークン色に切り替わる（テーマ追従）', () => {
    mockUseTheme.mockReturnValue(DARK);

    render(
      <TabButton isFocused symbol={SYMBOL}>
        ホーム
      </TabButton>,
    );

    expect(screen.getByText('ホーム')).toHaveStyle({ color: DARK.primary });
  });

  it('長い英語ラベルでも1行に収め、フォーカス時もフォントサイズを変えない', () => {
    mockUseTheme.mockReturnValue(LIGHT);

    render(
      <TabButton isFocused symbol={SYMBOL}>
        Settings
      </TabButton>,
    );

    const label = screen.getByText('Settings');

    expect(label).toHaveProp('numberOfLines', 1);
    expect(label).toHaveProp('adjustsFontSizeToFit', true);
    expect(label).toHaveStyle({
      fontSize: 11,
      fontWeight: '800',
    });
  });
});
