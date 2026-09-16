import { type SymbolViewProps } from 'expo-symbols';
import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

import type { MannerKind } from '../../domain/manner-item';

/** バッジの配色一式（背景・枠線・前景=文字/アイコン）。 */
type KindBadgeColorSet = {
  background: string;
  border: string;
  foreground: string;
};

/**
 * 分類ごとのバッジ配色。
 * ルールは塗りつぶしの警告アンバー、マナーは塗りつぶしの緑。いずれも背景＝分類色 / 白文字で強調する。
 */
export const KIND_BADGE_COLORS: Record<MannerKind, KindBadgeColorSet> = {
  manner: {
    background: '#22C55E',
    border: '#22C55E',
    foreground: '#FFFFFF',
  },
  rule: {
    background: '#F59E0B',
    border: '#F59E0B',
    foreground: '#FFFFFF',
  },
};

/**
 * 分類ごとのアクセント色（カードの枠線・タイトルに使用）。
 * ルールは警告アンバー、マナーは緑。いずれも塗りつぶしバッジの背景色を流用する。カード系 UI はこの値を参照する。
 */
export const KIND_ACCENT_COLOR: Record<MannerKind, string> = {
  manner: KIND_BADGE_COLORS.manner.background,
  rule: KIND_BADGE_COLORS.rule.background,
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 分類ごとのカード半透明背景（一覧向け）。不透明色ではなく alpha を使い、
 * ライト/ダーク両テーマで馴染ませる。{@link KIND_ACCENT_COLOR} から導出するため配色変更に追従する。
 */
export const KIND_CARD_BACKGROUND: Record<MannerKind, string> = {
  manner: hexToRgba(KIND_ACCENT_COLOR.manner, 0.08),
  rule: hexToRgba(KIND_ACCENT_COLOR.rule, 0.08),
};

/** 観光詳細など埋め込みコンテキスト向け。一覧より控えめな透明度。 */
export const KIND_CARD_BACKGROUND_SUBTLE: Record<MannerKind, string> = {
  manner: hexToRgba(KIND_ACCENT_COLOR.manner, 0.06),
  rule: hexToRgba(KIND_ACCENT_COLOR.rule, 0.06),
};

/** 分類ごとのアイコン。ルールは注意喚起の警告三角、マナーは「お願い」を表す手のアイコン。 */
export const KIND_BADGE_ICONS: Record<MannerKind, SymbolViewProps['name']> = {
  manner: { ios: 'hand.raised.fill', android: 'front_hand', web: 'front_hand' },
  rule: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
};

export const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
