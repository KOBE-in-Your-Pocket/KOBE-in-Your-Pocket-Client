import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { KOBE_INITIAL_REGION } from './kobe-initial-region';
import { ROUTE_STROKE_COLOR, styles } from './styles/map.styles';

import type { MapProps } from './map.types';

/**
 * 地図コンポーネントの雛形。
 * 初期表示は神戸市中心付近（{@link KOBE_INITIAL_REGION}）。
 * `currentLocation` が渡されたときのみ現在地ピンを表示する。
 */
export function Map({
  style,
  currentLocation,
  markers,
  onMarkerPress,
  routeCoordinates,
}: MapProps) {
  return (
    <MapView
      style={[styles.map, style]}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={KOBE_INITIAL_REGION}
    >
      {routeCoordinates && routeCoordinates.length > 1 ? (
        <Polyline coordinates={routeCoordinates} strokeColor={ROUTE_STROKE_COLOR} strokeWidth={4} />
      ) : null}
      {markers?.map((marker) =>
        marker.variant === 'evacuation' ? (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress?.(marker)}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            {/* 避難所ピン: 緑バッジ + 白い十字（観光の標準赤ピンと区別） */}
            <View style={styles.evacuationMarker}>
              <View style={styles.evacuationCrossVertical} />
              <View style={styles.evacuationCrossHorizontal} />
            </View>
          </Marker>
        ) : (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress?.(marker)}
          />
        ),
      )}
      {currentLocation ? (
        <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          {/* Google/Apple マップ風の現在地ドット（白フチ + 青ドット） */}
          <View style={styles.currentLocationOuter}>
            <View style={styles.currentLocationInner} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}
