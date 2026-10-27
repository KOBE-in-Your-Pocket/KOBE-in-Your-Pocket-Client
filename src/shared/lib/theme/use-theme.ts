import { useThemeScheme } from './use-theme-scheme';

import { Colors } from '@/shared/config';

/**
 * 現在のカラーテーマ（{@link Colors} のライト / ダーク）を返す単一のアクセサ。
 * 端末のダークモード設定（{@link useThemeScheme}）に連動し、UI はこのフック経由で色を参照する。
 *
 * `useColorScheme` は未確定時に `null` / `undefined` を返しうるため、`'dark'` 以外はライトに倒す
 * （未確定で `Colors[null]` を引いて undefined にならないようにする安全な既定）。
 */
export function useTheme() {
  return Colors[useThemeScheme()];
}
