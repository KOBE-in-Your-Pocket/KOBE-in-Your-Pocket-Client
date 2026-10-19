import { StyleSheet } from 'react-native';

import type { ShelterType } from '../../domain/evacuation-shelter';
import type { PlatformSymbolName } from '../types';

import { Spacing } from '@/shared/config';

export type ShelterTypeBadgeStyle = {
  /** 文字・アイコン・枠線の強調色。 */
  color: string;
  /** バッジ背景（強調色を薄く敷く）。 */
  background: string;
  icon: PlatformSymbolName;
};

/**
 * 避難所区分ごとの配色・アイコン。災害ごとの適否（緑/橙/赤）と意味が被らないよう、
 * 「良し悪し」ではなく「種類」が伝わる別系統の色にしている。
 * - emergency（指定緊急避難場所）: 危険から今すぐ逃げ込む場所 → 橙＋走るアイコン
 * - designated（指定避難所）: 災害後に滞在する場所 → 青＋家アイコン
 * - both（兼用）: 緊急避難場所と指定避難所を兼ねる → 紫＋シールドアイコン
 */
export const SHELTER_TYPE_BADGE: Record<ShelterType, ShelterTypeBadgeStyle> = {
  emergency: {
    color: '#EA580C',
    background: 'rgba(234, 88, 12, 0.12)',
    icon: { ios: 'figure.run', android: 'directions_run', web: 'directions_run' },
  },
  designated: {
    color: '#2563EB',
    background: 'rgba(37, 99, 235, 0.12)',
    icon: { ios: 'house.fill', android: 'home', web: 'home' },
  },
  both: {
    color: '#7C3AED',
    background: 'rgba(124, 58, 237, 0.12)',
    icon: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
  },
};

export const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    lineHeight: 18,
  },
});
