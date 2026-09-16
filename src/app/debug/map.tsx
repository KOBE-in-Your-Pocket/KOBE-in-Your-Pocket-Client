import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/shared/config';
import { KOBE_INITIAL_REGION, Map, ThemedText, ThemedView } from '@/shared/ui';

export default function MapDebugScreen() {
  return (
    <ThemedView style={styles.container}>
      <Map style={styles.map} />
      <SafeAreaView style={styles.overlay} pointerEvents="none">
        <ThemedView type="backgroundElement" style={styles.badge}>
          <ThemedText type="smallBold">Map</ThemedText>
          <ThemedText type="code">
            initial: {KOBE_INITIAL_REGION.latitude}, {KOBE_INITIAL_REGION.longitude}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.four,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
});
