import { TabListProps } from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { styles } from '../styles/custom-tab-list.styles';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      {...props}
      style={[styles.tabListContainer, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}
    >
      {/* 背景・上端の境界線をテーマ追従にする。ダークでも地色との境界が分かるよう上端に薄い境界線を引く。 */}
      <View
        style={[styles.tabBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}
      >
        {props.children}
      </View>
    </View>
  );
}
