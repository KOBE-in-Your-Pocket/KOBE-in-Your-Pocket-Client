import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 選択中の絞り込みタグの背景色（琥珀。ホーム観光カード等と統一）。 */
export const SELECTED_CHIP_COLOR = '#F59E0B';

/** チップ行の高さ（チップの上下 padding + 文字の lineHeight + 行の上下 padding）。 */
const CHIP_TEXT_LINE_HEIGHT = 18;
const CHIP_ROW_HEIGHT = Spacing.two * 2 + CHIP_TEXT_LINE_HEIGHT + Spacing.one * 2;

export const styles = StyleSheet.create({
  scroll: {
    marginTop: Spacing.two,
    // iOS では横スクロール ScrollView の高さがコンテンツから推定されず 0 に潰れ、
    // チップが表示されないことがある（親が高さ非確定の非スクロール View のため。Android は表示される）。
    // 高さを明示して iOS / Android の両方で必ずタブ（チップ）が表示されるようにする。
    height: CHIP_ROW_HEIGHT,
  },
  contentContainer: {
    flexDirection: 'row',
    // 高さを固定したぶん、チップを縦方向の中央に揃える。
    alignItems: 'center',
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
    lineHeight: CHIP_TEXT_LINE_HEIGHT,
    fontWeight: '600',
  },
});
