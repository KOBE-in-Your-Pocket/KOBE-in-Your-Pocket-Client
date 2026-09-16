import { ThemedText } from '../themed/themed-text';
import { ThemedView } from '../themed/themed-view';

import { styles } from './styles/map.web.styles';

import type { MapProps } from './map.types';

/**
 * Web 向けフォールバック。
 * react-native-maps は Web 未サポートのため、代替の案内を表示する。
 * `currentLocation` はネイティブ版とのシグネチャ互換のため受け取るが、ここでは使わない。
 */
export function Map({ style }: MapProps) {
  return (
    <ThemedView type="backgroundElement" style={[styles.placeholder, style]}>
      <ThemedText type="small">地図はモバイルアプリでご利用いただけます。</ThemedText>
    </ThemedView>
  );
}
