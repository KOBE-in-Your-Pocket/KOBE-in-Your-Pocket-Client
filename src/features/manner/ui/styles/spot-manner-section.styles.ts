import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    // flex:1 の左右区切り線に押されて長い訳文がはみ出さないよう、見出し側を縮小可能にする。
    flexShrink: 1,
  },
  // サブタイトルの左右に薄い区切り線を入れる行（ホームのタイトル区切り線と同じ 1dp・textSecondary）。
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionTitleDivider: {
    flex: 1,
    height: 1,
  },
  // 3列グリッド。横並び＋折り返しで1行に3枚並べる。
  // 列間・行間のすき間は gap ではなくセル（cell）の内側 padding で作る。% 幅と gap（固定dp）を
  // 併用すると、幅の狭い端末（分割画面・フォルダブル等）で 3×% + gap がコンテナ幅を超え、
  // 3枚目が折り返して2列になってしまうため、gap は使わない（manner-list の2列グリッドと同方式）。
  // セル外周の padding 分は marginHorizontal の負値で相殺し、左右をセクション端に揃える。
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
  },
  // 3列グリッドの1セル。幅を 1/3 に固定し、画面幅に関わらず必ず3列になるようにする。
  // 内側の余白（padding）が列間・行間のすき間になる。
  cell: {
    width: '33.33%',
    padding: Spacing.one,
  },
  // カードはセル幅いっぱいに広がり（width 指定なし）、aspectRatio:1 でほぼ正方形にする。
  // 中身はピクトグラムのみを縦横中央に置く。分類アクセント色の枠線＋控えめな背景で強調する
  // （色はコンポーネントで分類ごとに指定）。
  card: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
