import { StyleSheet } from 'react-native';

/** 現在地ドットの色（アプリのテーマブルー）。 */
const CURRENT_LOCATION_BLUE = '#208AEF';

/** 経路ライン（Polyline）の色。 */
export const ROUTE_STROKE_COLOR = '#208AEF';

/** 避難所マーカーの色（安全色系の緑。観光ピンの赤と明確に区別する）。 */
const EVACUATION_MARKER_GREEN = '#0F8A4F';

export const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  currentLocationOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  currentLocationInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: CURRENT_LOCATION_BLUE,
  },
  // 避難所マーカー: 緑の丸バッジ（白フチ）に白い十字を重ねた安全標識風の見た目。
  evacuationMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: EVACUATION_MARKER_GREEN,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  evacuationCrossVertical: {
    position: 'absolute',
    width: 4,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  evacuationCrossHorizontal: {
    position: 'absolute',
    width: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
