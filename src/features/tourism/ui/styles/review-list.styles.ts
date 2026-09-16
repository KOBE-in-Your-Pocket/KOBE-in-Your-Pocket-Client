import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const RATING_STAR_COLOR = '#F5A623';
export const EMPTY_STAR_COLOR = '#D8D8D8';

export const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  centered: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  item: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  authorMeta: {
    flex: 1,
    gap: Spacing.half,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.half,
  },
  comment: {
    lineHeight: 22,
  },
});
