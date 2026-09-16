import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // 地図タイル上に重ねるため、テーマ色ではなく地図の明るさに対して読める配色にする。
  attribution: {
    position: 'absolute',
    left: Spacing.two,
    bottom: Spacing.two,
    maxWidth: '90%',
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    color: '#1A1A1A',
    fontSize: 10,
  },
});
