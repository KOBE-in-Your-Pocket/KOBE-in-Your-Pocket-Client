import { useColorScheme } from './use-color-scheme';

/** 画面で扱うカラースキーム。未確定（`null` / `undefined`）はここで潰してライトに倒す。 */
export type ThemeScheme = 'light' | 'dark';

/**
 * 現在のカラースキーム（`'light'` / `'dark'`）を返す。
 * カラートークン（{@link useTheme}）に無い画面固有の固定色を、`{ light, dark }` の組から
 * 選び分けるために使う。未確定時はライトに倒し、`useTheme` と判定を揃える。
 */
export function useThemeScheme(): ThemeScheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}
