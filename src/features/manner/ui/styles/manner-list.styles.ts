import { PixelRatio, StyleSheet } from 'react-native';

import { BottomTabInset, Fonts, Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  listContent: {
    paddingHorizontal: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  /** 絞り込み結果が 0 件のときにヘッダー下へ表示する空メッセージ。 */
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  header: {
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  // 一覧画面・ホーム画面と同じ装飾タイトル（筆記体・中央揃え・fontSize 30 / lineHeight 40）。
  title: {
    fontFamily: Fonts.cursive,
    fontWeight: 'normal',
    fontSize: 30,
    lineHeight: 40,
    textAlign: 'center',
  },
  // タイトルを上下で挟む区切り線（一覧画面・ホーム画面と同一スタイル）。
  divider: {
    height: PixelRatio.roundToNearestPixel(1),
    alignSelf: 'stretch',
  },
  // 2 列グリッドの1セル。幅を 50% に固定し、奇数件でも最後のカードが2列分に広がらないようにする。
  // 内側の余白（padding）が列間・行間のすき間になる。
  cell: {
    width: '50%',
    padding: Spacing.two,
  },
  // 2 列グリッドのカード。ピクトグラムを大きく中央に、その下にバッジ・タイトルを縦積みする。
  // 幅はセル（cell）が決めるため、flex:1 は行内で高さを揃える用途のみ。
  // 分類アクセント色の枠線＋薄い背景で強調する（色はコンポーネントで分類ごとに指定）。
  card: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
  },
  pictogramWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // タイトルは分類アクセント色で強調する（色はコンポーネントで指定）。
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
