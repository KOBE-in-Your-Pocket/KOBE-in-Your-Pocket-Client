/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * アプリ全体で参照するカラートークン（ライト / ダークの2系統）。
 * ここが唯一の定義元で、UI からは {@link useTheme} 経由で現在のテーマを取得する。
 * 既存画面の見た目を変えないため、既存トークンのライト値は従来どおりに保つこと。
 *
 * トークンの意味:
 * - `text` / `textSecondary`: 本文・補助テキスト
 * - `background`: 画面の地色
 * - `backgroundElement`: カード・入力欄などの要素背景
 * - `backgroundSelected`: 選択中・押下中の背景
 * - `primary` / `onPrimary`: ブランド基調色（ボタン・リンク等）とその上に載せる文字・アイコン色
 * - `border`: 区切り線・枠線の控えめな境界色
 */
export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#208AEF',
    onPrimary: '#FFFFFF',
    border: '#D9D9E0',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#4DA3F5',
    onPrimary: '#FFFFFF',
    border: '#3A3D42',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * 筆記体（スクリプト体）の family 名。`expo-font` で全プラットフォーム共通の名前で
 * ロードするため、iOS / Android / Web いずれも同じ値を参照する。
 * ロードは `useFontsBootstrap`（AppProviders）がこの定数をキーに使って行うため、
 * family 名とロードキーは常に一致する。
 */
export const CURSIVE_FONT_FAMILY = 'DancingScript_600SemiBold';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
    /** 筆記体（Dancing Script） */
    cursive: CURSIVE_FONT_FAMILY,
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    cursive: CURSIVE_FONT_FAMILY,
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
    cursive: CURSIVE_FONT_FAMILY,
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** ThemedText の `small`/`smallBold` の行の高さ。アイコンを本文1行目に揃える際にも使う。 */
export const SMALL_TEXT_LINE_HEIGHT = 20;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
