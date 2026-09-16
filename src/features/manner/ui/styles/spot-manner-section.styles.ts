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
  itemList: {
    gap: Spacing.two,
  },
  // カードは分類アクセント色の枠線＋控えめな背景で強調する（色はコンポーネントで分類ごとに指定）。
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: Spacing.half,
  },
  // タイトルは分類アクセント色で強調する（色はコンポーネントで指定）。
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDescription: {
    lineHeight: 18,
  },
});
