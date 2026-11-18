import { StyleSheet } from 'react-native';

import { BottomTabInset, Spacing } from '@/shared/config';

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
    paddingBottom: Spacing.three,
  },
  // 絞り込みボタンだけを右端に置く行。
  // 一覧の外側の余白（listContent の Spacing.two）に加えてカードの外側の余白ぶん内側に寄せ、
  // ボタンの右端をカードの右端にそろえる。
  filterRow: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.two,
  },
  // 絞り込みモーダルを開くボタン（アイコン＋ラベルのピル）。
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  filterButtonText: {
    fontWeight: '700',
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
