import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.three,
    // 右下・下部タブのすぐ上に配置（画面下端からの実値。詰めすぎるとタブバーに重なる）。
    bottom: Spacing.four,
    zIndex: 1,
  },
});
