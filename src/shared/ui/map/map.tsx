import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useEffect, useRef, type ComponentRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { KOBE_INITIAL_REGION } from './kobe-initial-region';
import {
  EVACUATION_ICON_SIZE,
  EVACUATION_ICON_SIZE_SELECTED,
  EVACUATION_MARKER_GREEN,
  ROUTE_STROKE_COLOR,
  styles,
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
 * `tracksViewChanges={false}` は初回スナップショットをレイアウト確定前に撮ってしまうことがあり、
 * {@link SymbolView} のような非同期読込コンテンツに限らず、見た目が崩れたまま固定されることがある（#735）。
 * 複数回 `redraw()` を呼ぶことでタイミングに関係なく確実に反映させる。
 *
 * 選択状態の切り替え（#749）によるサイズ変更も、`redraw()` の呼び直しではなく、
 * マーカー自体を key で作り直す（後述）ことでこの初回スナップショット処理に乗せている。
 * 既存マーカーのサイズだけを変えて `redraw()` し直すと、ネイティブ側が古いビットマップを
 * 完全に差し替えず、新旧の見た目が二重写しになって残ることがあったため（#749 追加修正）。
 */
const MOUNT_REDRAW_DELAYS_MS = [300, 800, 1500];

/**
 * マーカーの重なり順（zIndex）。大きいほど手前に描画される。
 * 現在地ピンは選択中の観光・避難所ピンと重なっても常に最前面に見えるようにする。
 */
const MARKER_Z_INDEX = {
  default: 0,
  selected: 1,
  currentLocation: 2,
} as const;

/** mount直後に {@link MOUNT_REDRAW_DELAYS_MS} の間隔で markerRef の `redraw()` を呼ぶ（#735）。 */
function useMarkerRedrawOnMount(markerRef: React.RefObject<ComponentRef<typeof Marker> | null>) {
  useEffect(() => {
    const timers = MOUNT_REDRAW_DELAYS_MS.map((delay) =>
      setTimeout(() => markerRef.current?.redraw(), delay),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * 避難所ピン。緑のしずく型＋白い円＋走る人ピクトグラムで観光ピンと区別する。
 * 先端が座標を指すよう `anchor={{x:0.5,y:1}}`。
 * 選択中（`isSelected`）は拡大し、他のピンより手前に表示する（#749）。
 */
function EvacuationMarker({
  marker,
  isSelected,
  onPress,
}: {
  marker: MapMarker;
  isSelected: boolean;
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
      zIndex={isSelected ? MARKER_Z_INDEX.selected : MARKER_Z_INDEX.default}
    >
      <View testID="evacuation-pin" style={styles.evacuationPin}>
        <View style={[styles.evacuationPinHead, isSelected && styles.evacuationPinHeadSelected]}>
          <View style={[styles.evacuationPinCore, isSelected && styles.evacuationPinCoreSelected]}>
            <SymbolView
              name={EVACUATION_ICON}
              tintColor={EVACUATION_MARKER_GREEN}
              size={isSelected ? EVACUATION_ICON_SIZE_SELECTED : EVACUATION_ICON_SIZE}
            />
          </View>
        </View>
        <View style={[styles.evacuationPinTip, isSelected && styles.evacuationPinTipSelected]} />
      </View>
    </Marker>
  );
}

/**
 * 観光ピン。赤いしずく型のカスタムピン（OS 標準ピンの置き換え、#748）。避難ピンと同じ構造。
 * `tracksViewChanges` はカスタムマーカーのスナップショット撮り直しコストを避けるため false にし、
 * mount 直後の複数回 `redraw()` でレイアウト確定前のスナップショット固定を防ぐ。
 * 先端が座標を指すよう `anchor={{x:0.5,y:1}}`。
 * 選択中（`isSelected`）は拡大し、他のピンより手前に表示する（#749）。
 */
function TourismMarker({
  marker,
  isSelected,
  onPress,
}: {
  marker: MapMarker;
  isSelected: boolean;
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
      zIndex={isSelected ? MARKER_Z_INDEX.selected : MARKER_Z_INDEX.default}
    >
      <View testID="tourism-pin" style={styles.tourismPin}>
        <View style={[styles.tourismPinHead, isSelected && styles.tourismPinHeadSelected]}>
          <View style={[styles.tourismPinDot, isSelected && styles.tourismPinDotSelected]} />
        </View>
        <View style={[styles.tourismPinTip, isSelected && styles.tourismPinTipSelected]} />
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
  selectedMarkerId,
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
        const isSelected = marker.id === selectedMarkerId;
        // 選択状態も key に含め、切り替わるたびにマーカーを作り直す（理由は MOUNT_REDRAW_DELAYS_MS 参照）。
        const key = `${marker.id}:${markerResyncKey ?? 0}:${isSelected ? 1 : 0}`;
        return marker.variant === 'evacuation' ? (
          <EvacuationMarker
            key={key}
            marker={marker}
            isSelected={isSelected}
            onPress={onMarkerPress}
          />
        ) : (
          <TourismMarker
            key={key}
            marker={marker}
            isSelected={isSelected}
            onPress={onMarkerPress}
          />
        );
      })}
      {currentLocation ? (
        <Marker
          coordinate={currentLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={MARKER_Z_INDEX.currentLocation}
        >
          {/* Google/Apple マップ風の現在地ドット（白フチ + 青ドット） */}
          <View testID="current-location-pin" style={styles.currentLocationOuter}>
            <View style={styles.currentLocationInner} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}
