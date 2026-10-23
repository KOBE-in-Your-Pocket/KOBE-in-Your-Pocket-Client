import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  // 地図右上に浮かせるアイコンボタン。MapModeToggle は右下固定のため重ならない。
  container: {
    position: 'absolute',
    right: Spacing.three,
    zIndex: 1,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
