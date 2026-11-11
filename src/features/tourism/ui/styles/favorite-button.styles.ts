import { StyleSheet } from 'react-native';

/** お気に入り済みのハートの色。赤（#EF4444）は避難モードの色なので、ピンク系にして意味を分ける。 */
export const FAVORITE_ACTIVE_COLOR = '#F43F5E';
/** 画像の上（overlay）に置くときの未登録のハートの色。 */
export const FAVORITE_OVERLAY_INACTIVE_COLOR = '#FFFFFF';

/** 押せる範囲の最小サイズ（Apple HIG の 44pt）。 */
const MIN_TOUCH_TARGET = 44;
/** overlay の丸の、アイコンの周りの余白（片側）。 */
export const OVERLAY_PADDING = 6;

/** 見た目が小さくても 44pt 四方は押せるよう、足りない分を hitSlop で補う。 */
export function touchHitSlop(visualSize: number): number {
  return Math.max(0, Math.ceil((MIN_TOUCH_TARGET - visualSize) / 2));
}

export const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    padding: OVERLAY_PADDING,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pressed: {
    opacity: 0.6,
  },
});
