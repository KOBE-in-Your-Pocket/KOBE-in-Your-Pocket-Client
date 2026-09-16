import '@testing-library/jest-native/extend-expect';

import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { SegmentedControl } from '../segmented-control';

// styles（Spacing）と ThemedText（Fonts）が参照する config を最小モック。
jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  Fonts: { mono: 'monospace' },
}));

// mock ファクトリから参照するため、変数名は `mock` プレフィックス必須（jest の制約）。
const mockTheme = {
  backgroundElement: '#F0F0F3',
  backgroundSelected: '#E0E1E6',
  text: '#111111',
  textSecondary: '#60646C',
};

// SegmentedControl / ThemedText の双方が同じテーマを参照する。
jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => mockTheme,
}));

const noop = () => {};

// 実行プラットフォームに応じた浮遊シャドウのスタイル（iOS: shadow*, Android: elevation）。
const shadowStyle = Platform.OS === 'android' ? { elevation: 4 } : { shadowOpacity: 0.15 };

/** 影の有無が載る track View。 */
function getTrack() {
  return screen.getByTestId('segmented-control-track');
}

describe('SegmentedControl', () => {
  describe('selectedColor を指定したとき', () => {
    const segments = [
      { value: 'tourism', label: '観光', selectedColor: '#3C87F7' },
      { value: 'evacuation', label: '避難', selectedColor: '#E8573C' },
    ];

    it('選択中セグメントの背景に selectedColor を使い、文字色を白にする', () => {
      render(<SegmentedControl segments={segments} value="tourism" onChange={noop} />);

      const selected = screen.getByRole('tab', { name: '観光', selected: true });
      expect(selected).toHaveStyle({ backgroundColor: '#3C87F7' });
      expect(screen.getByText('観光')).toHaveStyle({ color: '#FFFFFF' });
    });

    it('選択が切り替わると背景色もそのセグメントの selectedColor になる', () => {
      render(<SegmentedControl segments={segments} value="evacuation" onChange={noop} />);

      const selected = screen.getByRole('tab', { name: '避難', selected: true });
      expect(selected).toHaveStyle({ backgroundColor: '#E8573C' });
      expect(screen.getByText('避難')).toHaveStyle({ color: '#FFFFFF' });
    });

    it('未選択セグメントには背景色を付けない', () => {
      render(<SegmentedControl segments={segments} value="tourism" onChange={noop} />);

      const unselected = screen.getByRole('tab', { name: '避難', selected: false });
      expect(unselected).not.toHaveStyle({ backgroundColor: '#E8573C' });
      expect(unselected).not.toHaveStyle({ backgroundColor: mockTheme.backgroundSelected });
    });
  });

  describe('selectedColor を指定しないとき（従来の見た目）', () => {
    const segments = [
      { value: 'tourism', label: '観光' },
      { value: 'evacuation', label: '避難' },
    ];

    it('選択中はテーマの backgroundSelected を使い、文字は白にしない', () => {
      render(<SegmentedControl segments={segments} value="tourism" onChange={noop} />);

      const selected = screen.getByRole('tab', { name: '観光', selected: true });
      expect(selected).toHaveStyle({ backgroundColor: mockTheme.backgroundSelected });

      const label = screen.getByText('観光');
      expect(label).toHaveStyle({ color: mockTheme.text });
      expect(label).not.toHaveStyle({ color: '#FFFFFF' });
    });
  });

  describe('elevated による影の ON/OFF', () => {
    const segments = [
      { value: 'tourism', label: '観光' },
      { value: 'evacuation', label: '避難' },
    ];

    it('既定（elevated 未指定）では track に影を付ける', () => {
      render(<SegmentedControl segments={segments} value="tourism" onChange={noop} />);

      expect(getTrack()).toHaveStyle(shadowStyle);
    });

    it('elevated={false} では track に影を付けない', () => {
      render(
        <SegmentedControl segments={segments} value="tourism" onChange={noop} elevated={false} />,
      );

      expect(getTrack()).not.toHaveStyle(shadowStyle);
    });
  });
});
