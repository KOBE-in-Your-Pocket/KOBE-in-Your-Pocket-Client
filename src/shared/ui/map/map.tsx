import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useRef, type ComponentRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { KOBE_INITIAL_REGION } from './kobe-initial-region';
import {
  EVACUATION_MARKER_GREEN,
  ROUTE_STROKE_COLOR,
  styles,
  TOURISM_PIN_RED,
} from './styles/map.styles';

import type { MapMarker, MapProps } from './map.types';

/** 「走る人（避難）」ピクトグラム。再レンダーごとの再生成を避けるためモジュール定数にする。 */
const EVACUATION_ICON: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol } = {
  ios: 'figure.run',
  android: 'directions_run',
  web: 'directions_run',
};

/**
 * ピン表示直後、この間隔（ms）でマーカーの見た目を撮り直す。
 * {@link SymbolView} はフォントを非同期読込するため、`tracksViewChanges` の自動検知だけに
 * 頼るとアイコン読込前のスナップショットのまま固定されることがある（#735）。
 * 複数回 `redraw()` を呼ぶことで読込タイミングに関係なく確実に反映させる。
 */
const MARKER_REDRAW_DELAYS_MS = [300, 800, 1500];

/**
 * 避難所ピン。緑のしずく型＋白い円＋走る人ピクトグラムで観光ピンと区別する。
 * 先端が座標を指すよう `anchor={{x:0.5,y:1}}`。
 */
function EvacuationMarker({
  marker,
  onPress,
}: {
  marker: MapMarker;
  onPress?: (marker: MapMarker) => void;
}) {
  const markerRef = useRef<ComponentRef<typeof Marker>>(null);

  useEffect(() => {
    const timers = MARKER_REDRAW_DELAYS_MS.map((delay) =>
      setTimeout(() => markerRef.current?.redraw(), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Marker
      ref={markerRef}
      coordinate={marker.coordinate}
      title={marker.title}
      description={marker.description}
      onPress={() => onPress?.(marker)}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      <View style={styles.evacuationPin}>
        <View style={styles.evacuationPinHead}>
          <View style={styles.evacuationPinCore}>
            <SymbolView name={EVACUATION_ICON} tintColor={EVACUATION_MARKER_GREEN} size={18} />
          </View>
        </View>
        <View style={styles.evacuationPinTip} />
      </View>
    </Marker>
  );
}

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
  markerResyncKey,
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
      {markers?.map((marker) => {
        const key = `${marker.id}:${markerResyncKey ?? 0}`;
        return marker.variant === 'evacuation' ? (
          <EvacuationMarker key={key} marker={marker} onPress={onMarkerPress} />
        ) : (
          <Marker
            key={key}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            // Android（Google Maps）の既定ピンはダークでも変わらないため、iOS だけ固定色を渡す。
            pinColor={Platform.OS === 'ios' ? TOURISM_PIN_RED : undefined}
            onPress={() => onMarkerPress?.(marker)}
          />
        );
      })}
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
