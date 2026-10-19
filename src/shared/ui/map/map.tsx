import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
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
 * 避難所ピン。緑のしずく型ピン（丸い頭＋下向き先端）＋白い円で、観光の赤ピンと区別する。
 * 先端（コンテナ下端）が座標を指すよう `anchor={{x:0.5,y:1}}` にする。
 *
 * `detailed` のとき白い円の中に「走る人」ピクトグラムを表示する。ネイティブの {@link SymbolView} は
 * フォント読込が非同期で初回スナップショットに写らないことがあるため、表示中は `tracksViewChanges` を
 * 常時有効にして確実に描画する（詳細表示は現在地が取れているときだけで、対象は半径 1km 内＝少数）。
 * `detailed` でないとき（現在地なし＝#604 の全件表示フォールバック等、マーカーが多数になりうる場合）は
 * アイコンを出さず純 View だけにし、`tracksViewChanges` を切って描画コストを抑える。
 */
function EvacuationMarker({
  marker,
  onPress,
  detailed,
}: {
  marker: MapMarker;
  onPress?: (marker: MapMarker) => void;
  detailed: boolean;
}) {
  return (
    <Marker
      coordinate={marker.coordinate}
      title={marker.title}
      description={marker.description}
      onPress={() => onPress?.(marker)}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={detailed}
    >
      <View style={styles.evacuationPin}>
        <View style={styles.evacuationPinHead}>
          <View style={styles.evacuationPinCore}>
            {detailed ? (
              <SymbolView name={EVACUATION_ICON} tintColor={EVACUATION_MARKER_GREEN} size={18} />
            ) : null}
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
}: MapProps) {
  // 現在地が取れているときは避難所の表示対象が半径 1km 内（少数）なのでアイコン付きの詳細ピンにする。
  // 現在地が無いとき（#604 のフォールバックで全避難所を表示している可能性）は多数になりうるため、
  // アイコン無しの簡易ピンにして描画負荷を抑える。
  const detailedEvacuation = currentLocation != null;

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
          <EvacuationMarker
            key={marker.id}
            marker={marker}
            onPress={onMarkerPress}
            detailed={detailedEvacuation}
          />
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
