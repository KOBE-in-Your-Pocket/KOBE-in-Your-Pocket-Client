import '@testing-library/jest-native/extend-expect';

import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '../themed-text';

// テーマ連動の色を検証するため useTheme を差し替え、ライト / ダークのトークンを注入できるようにする。
const mockUseTheme = jest.fn();
jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => mockUseTheme(),
}));

// @/shared/config 経由の CSS 読み込み（theme.ts の global.css）を避けるため、必要な値だけモックする。
jest.mock('@/shared/config', () => ({
  Fonts: { mono: 'monospace' },
  SMALL_TEXT_LINE_HEIGHT: 20,
}));

const LIGHT = { text: '#000000', primary: '#208AEF' };
const DARK = { text: '#ffffff', primary: '#4DA3F5' };

describe('ThemedText', () => {
  afterEach(() => mockUseTheme.mockReset());

  it('linkPrimary はテーマの primary 色で表示する（ライト）', () => {
    mockUseTheme.mockReturnValue(LIGHT);

    render(<ThemedText type="linkPrimary">リンク</ThemedText>);

    expect(screen.getByText('リンク')).toHaveStyle({ color: LIGHT.primary });
  });

  it('linkPrimary はダークでもテーマの primary に追従する', () => {
    mockUseTheme.mockReturnValue(DARK);

    render(<ThemedText type="linkPrimary">リンク</ThemedText>);

    expect(screen.getByText('リンク')).toHaveStyle({ color: DARK.primary });
  });

  it('linkPrimary 以外はテーマの text 色（または themeColor）を使う', () => {
    mockUseTheme.mockReturnValue(LIGHT);

    render(<ThemedText>本文</ThemedText>);

    expect(screen.getByText('本文')).toHaveStyle({ color: LIGHT.text });
  });
});
