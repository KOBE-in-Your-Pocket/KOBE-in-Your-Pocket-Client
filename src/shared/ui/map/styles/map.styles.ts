import { StyleSheet } from 'react-native';

/** 現在地ドットの色（アプリのテーマブルー）。 */
const CURRENT_LOCATION_BLUE = '#208AEF';

/** 経路ライン（Polyline）の色。 */
export const ROUTE_STROKE_COLOR = '#208AEF';

/**
 * 観光ピンの色（iOS のライト時の標準ピンと同じ赤）。iOS は未指定だとシステムの動的な赤になり、
 * ダークでくすんだ赤に変わるため、固定色を明示してテーマに関わらず同じ見た目にする。
 */
export const TOURISM_PIN_RED = '#FF2D55';

/** 避難所マーカーの色（安全色系の緑。観光ピンの赤と明確に区別する）。アイコンの tint にも使う。 */
export const EVACUATION_MARKER_GREEN = '#0F8A4F';

/** マーカーを地図から浮かせる共通のドロップシャドウ（現在地ドット・避難ピンで共有）。 */
const MARKER_SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 4,
} as const;

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
    ...MARKER_SHADOW,
  },
  currentLocationInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: CURRENT_LOCATION_BLUE,
  },
  // 避難所マーカー: 緑のしずく型ピン（丸い頭＋下向きの先端）。
  // 頭の中に白い円を敷き、緑の「走る人（避難）」ピクトグラムを重ねる。観光の標準赤ピンと明確に区別する。
  // コンテナ下端＝先端になるよう頭の下に三角を置き、Marker 側で anchor={{x:0.5,y:1}} を指定して座標を指す。
  evacuationPin: {
    alignItems: 'center',
  },
  evacuationPinHead: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: EVACUATION_MARKER_GREEN,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...MARKER_SHADOW,
  },
  // 頭の中の白い円。中に緑のピクトグラムを置く。
  evacuationPinCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ピン先端の下向き三角（border トリックで作成）。頭に少し食い込ませてしずく型に見せる。
  evacuationPinTip: {
    width: 0,
    height: 0,
    marginTop: -7,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: EVACUATION_MARKER_GREEN,
  },
});
