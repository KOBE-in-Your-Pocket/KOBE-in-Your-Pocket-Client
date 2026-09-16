import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/shared/config';
import { useCurrentLocation } from '@/shared/lib/geo';
import { ThemedText, ThemedView } from '@/shared/ui';

export default function UseCurrentLocationDebugScreen() {
  const { loading, error, coords } = useCurrentLocation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">useCurrentLocation</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <Row label="loading" value={String(loading)} />
          <Row label="error" value={error ? error.message : 'null'} />
          <Row label="latitude" value={coords ? coords.latitude.toFixed(6) : '—'} />
          <Row label="longitude" value={coords ? coords.longitude.toFixed(6) : '—'} />
          <Row
            label="accuracy(m)"
            value={coords?.accuracy != null ? coords.accuracy.toFixed(1) : '—'}
          />
        </ThemedView>

        <ThemedText type="small">
          初回アクセスで権限ダイアログが出ます。拒否すると error に文言が入ります。
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.row}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="code">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
