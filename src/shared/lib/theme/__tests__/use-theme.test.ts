import { renderHook } from '@testing-library/react-native';

import { Colors } from '@/shared/config';

import { useTheme } from '../use-theme';

const mockUseColorScheme = jest.fn();

jest.mock('../use-color-scheme', () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

describe('useTheme', () => {
  afterEach(() => {
    mockUseColorScheme.mockReset();
  });

  it('端末がダーク設定のときはダークのトークンを返す', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(Colors.dark);
  });

  it('端末がライト設定のときはライトのトークンを返す', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(Colors.light);
  });

  it.each([[null], [undefined]])('色設定が未確定（%s）のときは安全側のライトに倒す', (scheme) => {
    mockUseColorScheme.mockReturnValue(scheme);

    const { result } = renderHook(() => useTheme());

    expect(result.current).toBe(Colors.light);
  });
});
