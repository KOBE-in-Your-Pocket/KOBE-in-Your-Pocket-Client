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

/** 観光ピン中心の濃い赤の円の色。 */
const TOURISM_PIN_DOT_COLOR = '#9C0038';

/** 観光ピンの頭（円）の直径。選択時の拡大表示（#749）で値を切り替えられるよう定数化する。 */
export const TOURISM_PIN_HEAD_SIZE = 28;

/** 観光ピン中心の濃い赤の円の直径。 */
const TOURISM_PIN_DOT_SIZE = 14;

/** 避難所ピンの頭（円）の直径。選択時の拡大表示（#749）で値を切り替えられるよう定数化する。 */
const EVACUATION_PIN_HEAD_SIZE = 34;

/** 避難所ピンの頭の中の白い円の直径。 */
const EVACUATION_PIN_CORE_SIZE = 24;

/** 避難所ピンの「走る人」ピクトグラムのサイズ（{@link SymbolView} の `size` に渡す）。 */
export const EVACUATION_ICON_SIZE = 18;

/** 観光ピン先端の三角（border トリック）の寸法。 */
const TOURISM_PIN_TIP = { marginTop: -4, borderWidth: 6, borderTopWidth: 16 };

/** 避難所ピン先端の三角（border トリック）の寸法。 */
const EVACUATION_PIN_TIP = { marginTop: -7, borderWidth: 8, borderTopWidth: 14 };

/**
 * 選択中ピンの拡大倍率（#749）。`transform: scale` は Android でピンが切れるため使わず、
 * 各ピンの width / height / borderRadius / border 幅をこの倍率で計算し直した専用スタイルに切り替える。
 */
const SELECTED_SCALE = 1.4;

const scale = (value: number) => Math.round(value * SELECTED_SCALE);

/** 選択中の観光ピンの頭（円）の直径。 */
const TOURISM_PIN_HEAD_SIZE_SELECTED = scale(TOURISM_PIN_HEAD_SIZE);

/** 選択中の観光ピン中心の円の直径。 */
const TOURISM_PIN_DOT_SIZE_SELECTED = scale(TOURISM_PIN_DOT_SIZE);

/** 選択中の避難所ピンの頭（円）の直径。 */
const EVACUATION_PIN_HEAD_SIZE_SELECTED = scale(EVACUATION_PIN_HEAD_SIZE);

/** 選択中の避難所ピンの頭の中の白い円の直径。 */
const EVACUATION_PIN_CORE_SIZE_SELECTED = scale(EVACUATION_PIN_CORE_SIZE);

/** 選択中の避難所ピンの「走る人」ピクトグラムのサイズ。 */
export const EVACUATION_ICON_SIZE_SELECTED = scale(EVACUATION_ICON_SIZE);

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
    width: EVACUATION_PIN_HEAD_SIZE,
    height: EVACUATION_PIN_HEAD_SIZE,
    borderRadius: EVACUATION_PIN_HEAD_SIZE / 2,
    backgroundColor: EVACUATION_MARKER_GREEN,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...MARKER_SHADOW,
  },
  // 選択中（#749）: width/height/borderRadius を拡大倍率で切り替える（transform は使わない）。
  evacuationPinHeadSelected: {
    width: EVACUATION_PIN_HEAD_SIZE_SELECTED,
    height: EVACUATION_PIN_HEAD_SIZE_SELECTED,
    borderRadius: EVACUATION_PIN_HEAD_SIZE_SELECTED / 2,
  },
  // 頭の中の白い円。中に緑のピクトグラムを置く。
  evacuationPinCore: {
    width: EVACUATION_PIN_CORE_SIZE,
    height: EVACUATION_PIN_CORE_SIZE,
    borderRadius: EVACUATION_PIN_CORE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evacuationPinCoreSelected: {
    width: EVACUATION_PIN_CORE_SIZE_SELECTED,
    height: EVACUATION_PIN_CORE_SIZE_SELECTED,
    borderRadius: EVACUATION_PIN_CORE_SIZE_SELECTED / 2,
  },
  // ピン先端の下向き三角（border トリックで作成）。頭に少し食い込ませてしずく型に見せる。
  evacuationPinTip: {
    width: 0,
    height: 0,
    marginTop: EVACUATION_PIN_TIP.marginTop,
    borderLeftWidth: EVACUATION_PIN_TIP.borderWidth,
    borderRightWidth: EVACUATION_PIN_TIP.borderWidth,
    borderTopWidth: EVACUATION_PIN_TIP.borderTopWidth,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: EVACUATION_MARKER_GREEN,
  },
  evacuationPinTipSelected: {
    marginTop: scale(EVACUATION_PIN_TIP.marginTop),
    borderLeftWidth: scale(EVACUATION_PIN_TIP.borderWidth),
    borderRightWidth: scale(EVACUATION_PIN_TIP.borderWidth),
    borderTopWidth: scale(EVACUATION_PIN_TIP.borderTopWidth),
  },
  // 観光ピン: 赤いしずく型（丸い頭＋下向きの先端）。避難所ピンと同じ構造（円の入れ子＋三角tip）で、
  // transform は使わない（react-native-maps のカスタムマーカーはネイティブ側でスナップショットを
  // 撮ってから表示するため、transform が撮り直し時に正しく反映されないことがある）。
  // コンテナ下端＝先端になるよう頭の下に三角を置き、Marker 側で anchor={{x:0.5,y:1}} を指定して座標を指す。
  tourismPin: {
    alignItems: 'center',
  },
  tourismPinHead: {
    width: TOURISM_PIN_HEAD_SIZE,
    height: TOURISM_PIN_HEAD_SIZE,
    borderRadius: TOURISM_PIN_HEAD_SIZE / 2,
    backgroundColor: TOURISM_PIN_RED,
    alignItems: 'center',
    justifyContent: 'center',
    ...MARKER_SHADOW,
    // 三角の平らな上辺が円の下に重なって継ぎ目が欠けて見えないよう、三角より前面に固定する。
    zIndex: 2,
  },
  // 選択中（#749）: width/height/borderRadius を拡大倍率で切り替える（transform は使わない）。
  tourismPinHeadSelected: {
    width: TOURISM_PIN_HEAD_SIZE_SELECTED,
    height: TOURISM_PIN_HEAD_SIZE_SELECTED,
    borderRadius: TOURISM_PIN_HEAD_SIZE_SELECTED / 2,
  },
  // 頭の中の濃い赤の円。
  tourismPinDot: {
    width: TOURISM_PIN_DOT_SIZE,
    height: TOURISM_PIN_DOT_SIZE,
    borderRadius: TOURISM_PIN_DOT_SIZE / 2,
    backgroundColor: TOURISM_PIN_DOT_COLOR,
  },
  tourismPinDotSelected: {
    width: TOURISM_PIN_DOT_SIZE_SELECTED,
    height: TOURISM_PIN_DOT_SIZE_SELECTED,
    borderRadius: TOURISM_PIN_DOT_SIZE_SELECTED / 2,
  },
  // ピン先端の下向き三角（避難所ピンと同じ border トリック）。
  tourismPinTip: {
    width: 0,
    height: 0,
    marginTop: TOURISM_PIN_TIP.marginTop,
    borderLeftWidth: TOURISM_PIN_TIP.borderWidth,
    borderRightWidth: TOURISM_PIN_TIP.borderWidth,
    borderTopWidth: TOURISM_PIN_TIP.borderTopWidth,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: TOURISM_PIN_RED,
    zIndex: 1,
  },
  tourismPinTipSelected: {
    marginTop: scale(TOURISM_PIN_TIP.marginTop),
    borderLeftWidth: scale(TOURISM_PIN_TIP.borderWidth),
    borderRightWidth: scale(TOURISM_PIN_TIP.borderWidth),
    borderTopWidth: scale(TOURISM_PIN_TIP.borderTopWidth),
  },
});
