import { StyleSheet } from 'react-native';

import { ThemedView } from '@/shared/ui';

import { MannerList } from './manner-list';

export function MannerScreen() {
  return (
    <ThemedView style={styles.container}>
      <MannerList />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
