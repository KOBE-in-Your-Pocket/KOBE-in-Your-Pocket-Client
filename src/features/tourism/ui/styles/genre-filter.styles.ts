import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 選択中の絞り込みタグの背景色（琥珀。ホーム観光カード等と統一）。 */
export const SELECTED_CHIP_COLOR = '#F59E0B';

export const styles = StyleSheet.create({
  scroll: {
    marginTop: Spacing.two,
  },
  contentContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
