import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  hero: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
    borderRadius: 20,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  // 背景に大きく敷く市章。左上が濃く、右下へ向けて白へフェードする（アセットに焼き込み済み）。
  emblem: {
    position: 'absolute',
    left: -Spacing.three,
    top: -Spacing.two,
    width: 210,
    height: 210,
  },
  // キャッチフレーズは右寄せ。フェード側（右）に置くため市章の濃い部分と重ならない。
  catchphrase: {
    alignItems: 'flex-end',
  },
  line: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'right',
  },
  // 締めの一文はサイズ・太さともに強調する（本文から一行空けて表示）。
  tagline: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: Spacing.two,
  },
});
