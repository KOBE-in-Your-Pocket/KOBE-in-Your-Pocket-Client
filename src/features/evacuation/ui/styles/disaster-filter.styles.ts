import { StyleSheet } from 'react-native';

import { CATEGORY_COLOR } from './evacuation-list.styles';

import { Spacing } from '@/shared/config';

/** 選択中の災害種別タグの背景色（避難所一覧の施設種別・距離バッジと同じ青）。 */
export const SELECTED_CHIP_COLOR = CATEGORY_COLOR;
/** 選択中の災害種別タグの文字色。背景が固定色のため、ダークモードでも読めるよう文字色も固定する。 */
export const SELECTED_CHIP_TEXT_COLOR = '#FFFFFF';

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
