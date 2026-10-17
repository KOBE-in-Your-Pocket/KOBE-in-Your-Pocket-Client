import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 選択中の行のアクセント色（青）。文字・チェックアイコンに使う。 */
export const FILTER_SELECTED_COLOR = '#2563EB';
/** 選択中の行の背景（薄い青）。ライト／ダークどちらの地色でも成立するよう半透明にする。 */
export const FILTER_SELECTED_BACKGROUND = 'rgba(37, 99, 235, 0.12)';

export const styles = StyleSheet.create({
  // 背景の暗幕。シートを上寄せにするため上揃え。暗幕のタップで閉じる。
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
  },
  // 上から出るシート。下側の角だけ丸め、一覧が下にのぞく見た目にする。
  sheet: {
    borderBottomLeftRadius: Spacing.four,
    borderBottomRightRadius: Spacing.four,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  // セクション見出し（CATEGORY / SCOPE）。小さめ・字間広め・大文字。
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  // 選択肢の行。角丸・ラベル左＋チェック右。
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
