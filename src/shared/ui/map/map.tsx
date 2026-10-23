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
 * 詳細ピン（アイコン＋常時トラッキング）にする避難所マーカー件数の上限。超えたら簡易ピンにする。
 * 以前は currentLocation の有無で判定していたが、#676 で半径「無制限」を選べるようになり
 * 前提が崩れたため件数ベースに変更。
 */
const DETAILED_EVACUATION_MARKER_LIMIT = 50;

/**
 * 避難所ピン。緑のしずく型＋白い円＋走る人ピクトグラム（`detailed`時のみ）で観光ピンと区別する。
 * 先端が座標を指すよう `anchor={{x:0.5,y:1}}`。
 * `tracksViewChanges` は `detailed` な間だけ有効にする（{@link SymbolView} のフォント非同期読込に対応するため）。
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
  const evacuationMarkerCount =
    markers?.filter((marker) => marker.variant === 'evacuation').length ?? 0;
  const detailedEvacuation = evacuationMarkerCount <= DETAILED_EVACUATION_MARKER_LIMIT;

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
