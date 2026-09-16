import { StyleSheet } from 'react-native';

import { EvacuationList } from './evacuation-list';

import { ThemedView } from '@/shared/ui';

export function EvacuationScreen() {
  return (
    <ThemedView style={styles.container}>
      <EvacuationList />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
