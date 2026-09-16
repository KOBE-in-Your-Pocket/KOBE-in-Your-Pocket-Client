import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
  },
  // ピクトグラムを大きく中央表示するヒーロー領域（色は分類ごとにコンポーネントで指定）。
  hero: {
    position: 'relative',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: Spacing.three,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  // タイトルは分類アクセント色で強調する（色はコンポーネントで指定）。
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  description: {
    lineHeight: 22,
  },
});
