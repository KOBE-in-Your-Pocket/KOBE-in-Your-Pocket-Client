import { StyleSheet } from 'react-native';

import { SpotList } from './spot-list';

import { ThemedView } from '@/shared/ui';

export function TourismScreen() {
  return (
    <ThemedView style={styles.container}>
      <SpotList />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
