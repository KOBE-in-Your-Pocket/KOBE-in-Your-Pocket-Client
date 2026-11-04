import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useRef, type ComponentRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { KOBE_INITIAL_REGION } from './kobe-initial-region';
import { EVACUATION_MARKER_GREEN, ROUTE_STROKE_COLOR, styles } from './styles/map.styles';

import type { MapMarker, MapProps } from './map.types';

/** 「走る人（避難）」ピクトグラム。再レンダーごとの再生成を避けるためモジュール定数にする。 */
const EVACUATION_ICON: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol } = {
  ios: 'figure.run',
  android: 'directions_run',
  web: 'directions_run',
};

/**
 * ピン表示直後、この間隔（ms）でマーカーの見た目を撮り直す。
 * `tracksViewChanges={false}` は初回スナップショットをレイアウト確定前に撮ってしまうことがあり、
 * {@link SymbolView} のような非同期読込コンテンツに限らず、見た目が崩れたまま固定されることがある（#735）。
 * 複数回 `redraw()` を呼ぶことでタイミングに関係なく確実に反映させる。
 */
const MARKER_REDRAW_DELAYS_MS = [300, 800, 1500];

/** mount直後に {@link MARKER_REDRAW_DELAYS_MS} の間隔で markerRef の `redraw()` を呼ぶ。 */
function useMarkerRedrawOnMount(markerRef: React.RefObject<ComponentRef<typeof Marker> | null>) {
  useEffect(() => {
    const timers = MARKER_REDRAW_DELAYS_MS.map((delay) =>
      setTimeout(() => markerRef.current?.redraw(), delay),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

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
  useMarkerRedrawOnMount(markerRef);

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
 * 観光ピン。赤いしずく型のカスタムピン（OS 標準ピンの置き換え、#748）。避難ピンと同じ構造。
 * `tracksViewChanges` はカスタムマーカーのスナップショット撮り直しコストを避けるため false にし、
 * mount 直後の複数回 `redraw()` でレイアウト確定前のスナップショット固定を防ぐ。
 * 先端が座標を指すよう `anchor={{x:0.5,y:1}}`。
 */
function TourismMarker({
  marker,
  onPress,
}: {
  marker: MapMarker;
  onPress?: (marker: MapMarker) => void;
}) {
  const markerRef = useRef<ComponentRef<typeof Marker>>(null);
  useMarkerRedrawOnMount(markerRef);

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
      <View testID="tourism-pin" style={styles.tourismPin}>
        <View style={styles.tourismPinHead}>
          <View style={styles.tourismPinDot} />
        </View>
        <View style={styles.tourismPinTip} />
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
          <TourismMarker key={key} marker={marker} onPress={onMarkerPress} />
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
