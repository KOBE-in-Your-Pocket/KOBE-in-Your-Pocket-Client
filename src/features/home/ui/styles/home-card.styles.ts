import { PixelRatio, StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 濃色カード上の文字・アイコン色（白固定）。 */
export const CARD_FOREGROUND = '#FFFFFF';

/** アイコンと名称を区切る縦線の色（濃色カード上の白を薄くして主張を抑える）。 */
export const CARD_DIVIDER = 'rgba(255, 255, 255, 0.5)';

export const styles = StyleSheet.create({
  // 1列で縦積み。左右半分ずつに区切り、左=アイコン / 右=名称。
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    borderRadius: 16,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
  // 4分割のうち左1（アイコン）。
  iconHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // アイコンと名称を区切る縦線。太さは物理ピクセルの整数倍になる dp 値に固定して
  // 端数丸めで太さが不揃いに見えるのを防ぐ（home-screen の divider と同じ方針）。
  divider: {
    width: PixelRatio.roundToNearestPixel(1),
    alignSelf: 'stretch',
    marginVertical: Spacing.two,
    backgroundColor: CARD_DIVIDER,
  },
  icon: {
    width: 32,
    height: 32,
  },
  // 名称領域。アイコン領域との比率は 1:4（比率を上げるほどアイコンと区切り線が左へ寄る）。
  // 縦方向は中央寄せ、テキストは左揃え（名称の下に説明文を積む）。
  labelHalf: {
    flex: 4,
    justifyContent: 'center',
    paddingLeft: Spacing.three,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
  },
  // 名称下の補足説明。強調せず小さめ・薄めで主張を抑える。
  description: {
    marginTop: Spacing.half,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    textAlign: 'left',
    opacity: 0.9,
  },
});
