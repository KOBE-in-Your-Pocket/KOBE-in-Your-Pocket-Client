import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** マナー種別の分類色（KIND_BADGE_COLORS）とは無関係な、スポットリンク用の固定色。 */
export const RELATED_SPOT_LINK_COLOR = {
  background: '#EAF2FF',
  foreground: '#1D5BBF',
};

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
    backgroundColor: RELATED_SPOT_LINK_COLOR.background,
  },
  relatedSpotText: {
    color: RELATED_SPOT_LINK_COLOR.foreground,
    fontWeight: '600',
  },
});
