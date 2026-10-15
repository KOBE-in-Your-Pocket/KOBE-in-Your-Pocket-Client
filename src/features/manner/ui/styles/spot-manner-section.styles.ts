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
  // 3列グリッド。横並び＋折り返しで、カードを1行に3枚ずつ並べる。
  // alignItems:'flex-start' で各カードを縦方向にストレッチさせない（既定 stretch だと
  // カード高さが行の高さに合わされ、card の aspectRatio:1 が打ち消されて横長になるため）。
  itemList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  // カードは分類アクセント色の枠線＋控えめな背景で強調する（色はコンポーネントで分類ごとに指定）。
  // 3列グリッドの1セル。width を 1/3 弱にして gap と合わせ、端末幅が変わっても常に3列で折り返す
  // （flexShrink の既定 0 と合わせ、端数行のカードが横に伸びて不揃いにならないようにする）。
  // 中身はピクトグラムのみを中央に置く。aspectRatio:1 でセルをほぼ正方形にする。
  card: {
    width: '31%',
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
