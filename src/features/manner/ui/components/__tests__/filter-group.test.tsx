import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text as MockText, type StyleProp, type TextStyle } from 'react-native';

import { FilterGroup, type FilterOption } from '../filter-group';

import type { ReactNode } from 'react';

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
    <MockText style={style}>{children}</MockText>
  ),
}));

const options: FilterOption<'all' | 'rule' | 'manner'>[] = [
  { value: 'all', label: '全て', selectedColor: '#6B7280' },
  { value: 'rule', label: 'ルール', selectedColor: '#EAB308' },
  { value: 'manner', label: 'マナー', selectedColor: '#22C55E' },
];

const flatten = (style: StyleProp<TextStyle>) => StyleSheet.flatten(style) ?? {};
const tagBackground = (label: string) =>
  flatten(screen.getByLabelText(label).props.style).backgroundColor;
const textColor = (label: string) => flatten(screen.getByText(label).props.style).color;

describe('FilterGroup', () => {
  it('見出しバッジと全タブを表示する', () => {
    render(<FilterGroup label="カテゴリー" options={options} selected="all" onSelect={() => {}} />);

    expect(screen.getByText('カテゴリー')).toBeTruthy();
    expect(screen.getByText('全て')).toBeTruthy();
    expect(screen.getByText('ルール')).toBeTruthy();
    expect(screen.getByText('マナー')).toBeTruthy();
  });

  it('選択中タブは選択肢ごとの色で塗り、文字を白にする', () => {
    render(
      <FilterGroup label="カテゴリー" options={options} selected="rule" onSelect={() => {}} />,
    );

    expect(tagBackground('ルール')).toBe('#EAB308');
    expect(textColor('ルール')).toBe('#FFFFFF');
  });

  it('非選択タブは選択色で塗らず、文字はグレー(#6B7280)にする', () => {
    render(
      <FilterGroup label="カテゴリー" options={options} selected="rule" onSelect={() => {}} />,
    );

    // 非選択タブの背景は選択色（#22C55E）ではない。
    expect(tagBackground('マナー')).not.toBe('#22C55E');
    expect(textColor('マナー')).toBe('#6B7280');
  });

  it('タブをタップすると onSelect が対応する値で呼ばれる', () => {
    const onSelect = jest.fn();
    render(<FilterGroup label="カテゴリー" options={options} selected="all" onSelect={onSelect} />);

    fireEvent.press(screen.getByText('マナー'));

    expect(onSelect).toHaveBeenCalledWith('manner');
  });
});
