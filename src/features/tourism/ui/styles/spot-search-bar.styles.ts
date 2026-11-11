import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  // 地図上部に浮かせる検索バー。MapSettingsButton と同じく top は insets.top を加算して動的に設定する。
  container: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: Spacing.two,
  },
});
