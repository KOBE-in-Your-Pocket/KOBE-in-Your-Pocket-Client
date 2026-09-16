import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing } from '@/shared/config';
import { ThemedText, ThemedView } from '@/shared/ui';

type DebugEntry = {
  href: '/debug/map' | '/debug/use-current-location';
  title: string;
  description: string;
};

const entries: DebugEntry[] = [
  {
    href: '/debug/map',
    title: 'Map',
    description: 'react-native-maps MapView 雛形（神戸市中心の初期表示）',
  },
  {
    href: '/debug/use-current-location',
    title: 'useCurrentLocation',
    description: 'expo-location 権限 & 現在地取得フックの動作確認',
  },
];

export default function DebugMenuScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Debug Menu</ThemedText>
        <ThemedText type="small">フックや内部機能の動作確認用</ThemedText>

        <ThemedView type="backgroundElement" style={styles.list}>
          {entries.map((entry) => (
            <Link key={entry.href} href={entry.href} style={styles.link}>
              <ThemedView style={styles.row}>
                <ThemedText type="default">{entry.title}</ThemedText>
                <ThemedText type="small">{entry.description}</ThemedText>
              </ThemedView>
            </Link>
          ))}
        </ThemedView>
      </SafeAreaView>
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
  list: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  link: {
    paddingVertical: Spacing.two,
  },
  row: {
    gap: Spacing.one,
  },
});
