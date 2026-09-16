import { TabListProps } from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { styles } from '../styles/custom-tab-list.styles';

import { Spacing } from '@/shared/config';

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[styles.tabListContainer, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}
    >
      <View style={styles.tabBar}>{props.children}</View>
    </View>
  );
}
