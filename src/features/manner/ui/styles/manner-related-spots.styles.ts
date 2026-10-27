import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/**
 * マナー種別の分類色（KIND_BADGE_COLORS）とは無関係な、スポットリンク用の固定色。
 * ダークでは淡い青地のチップが浮いて眩しいため、半透明の青地に明るい青字にする。
 */
export const RELATED_SPOT_LINK_COLOR = {
  light: { background: '#EAF2FF', foreground: '#1D5BBF' },
  dark: { background: 'rgba(77, 163, 245, 0.18)', foreground: '#8AC2FF' },
} as const;

export const styles = StyleSheet.create({
  relatedSpots: {
    gap: Spacing.one,
  },
  relatedSpotChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  relatedSpotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.four,
  },
  relatedSpotText: {
    fontWeight: '600',
  },
});
