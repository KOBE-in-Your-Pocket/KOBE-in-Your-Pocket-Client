import { renderHook } from '@testing-library/react-native';

import { useThemeScheme } from '../use-theme-scheme';

const mockUseColorScheme = jest.fn();

jest.mock('../use-color-scheme', () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

describe('useThemeScheme', () => {
  afterEach(() => {
    mockUseColorScheme.mockReset();
  });

  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
  ])('端末が %s 設定のときは %s を返す', (scheme, expected) => {
    mockUseColorScheme.mockReturnValue(scheme);

    const { result } = renderHook(() => useThemeScheme());

    expect(result.current).toBe(expected);
  });

  it.each([[null], [undefined]])('色設定が未確定（%s）のときは安全側のライトに倒す', (scheme) => {
    mockUseColorScheme.mockReturnValue(scheme);

    const { result } = renderHook(() => useThemeScheme());

    expect(result.current).toBe('light');
  });
});
