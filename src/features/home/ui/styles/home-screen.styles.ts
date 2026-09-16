import { PixelRatio, StyleSheet } from 'react-native';

import { BottomTabInset, Fonts, Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  titleBlock: {
    // 内カメ（ノッチ/パンチホール）に被らないよう SafeArea 上端から余白を確保。
    marginTop: Spacing.one,
    // タイトルと上下の区切り線の間隔（上下対称）。
    gap: Spacing.two,
  },
  title: {
    // 筆記体・中央揃え・共有 title(48) より小さめ。
    fontFamily: Fonts.cursive,
    fontWeight: 'normal',
    fontSize: 30,
    lineHeight: 40,
    textAlign: 'center',
  },
  // タイトルとコンテンツを分ける区切り線。上下で同一のものを使う（色はテーマ依存でコンポーネント側から指定）。
  // 太さは物理ピクセルの整数倍になる dp 値に固定する。hairlineWidth や 1dp だと
  // 描画位置の端数によって上下で 2px/3px に丸められ、太さ・濃さが不揃いに見えるため。
  divider: {
    height: PixelRatio.roundToNearestPixel(1),
    alignSelf: 'stretch',
  },
  grid: {
    gap: Spacing.three,
  },
});
