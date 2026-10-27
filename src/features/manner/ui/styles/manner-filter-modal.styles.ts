import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/**
 * 選択中の行の配色（青）。`color` は文字・チェックアイコン、`background` は行の地に薄く敷く。
 * ダークでは濃い青だと暗い行背景に沈むため、明るい青に寄せる。
 */
export const FILTER_SELECTED_COLORS = {
  light: { color: '#2563EB', background: 'rgba(37, 99, 235, 0.12)' },
  dark: { color: '#60A5FA', background: 'rgba(96, 165, 250, 0.18)' },
} as const;

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
