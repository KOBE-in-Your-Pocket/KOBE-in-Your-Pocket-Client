import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/**
 * 適否ごとの強調色。`null` はテーマの補助テキスト色を使う（対象外・情報なし）。
 * 背景が白・黒どちらでも読めるよう、彩度を落とした濃いめの色にしている。
 */
export const SUITABILITY_COLORS = {
  suitable: '#16A34A',
  conditional: '#D97706',
  unsuitable: '#DC2626',
  'not-applicable': null,
  unknown: null,
} as const;

/**
 * カード用チップの背景色（強調色を薄く敷く）。`null` はテーマの要素背景色を使う。
 * 枠線付きのピル型にすると一覧上部の絞り込みタグと見分けが付かず押せそうに見えるため、
 * 角丸の四角を薄く塗る形にしている。
 */
export const SUITABILITY_CHIP_BACKGROUNDS = {
  suitable: 'rgba(22, 163, 74, 0.12)',
  conditional: 'rgba(217, 119, 6, 0.14)',
  unsuitable: 'rgba(220, 38, 38, 0.12)',
  'not-applicable': null,
  unknown: null,
} as const;

export const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowLabel: {
    flex: 1,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusText: {
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
