import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
  // 背景色・上端境界線の色はテーマ追従のためコンポーネント側で指定する。
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
});
