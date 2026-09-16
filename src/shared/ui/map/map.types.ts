import type { AppMode } from '@/shared/config';
import type { StyleProp, ViewStyle } from 'react-native';

/** 地図上に表示する緯度経度。 */
export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

/**
 * マーカーの見た目のバリアント。アプリのモード（{@link AppMode}）に対応する。
 * - `tourism`: 標準ピン（観光スポット）。
 * - `evacuation`: 避難所用の緑バッジ + 十字アイコン（観光ピンと視覚的に区別）。
 */
export type MapMarkerVariant = AppMode;

/** 地図上に表示する汎用マーカー（観光スポット・避難所など）。 */
export type MapMarker = {
  /** マーカーの一意な識別子（React の key・タップ識別に使用）。 */
  id: string;
  coordinate: MapCoordinate;
  /** タップ時に表示する吹き出しのタイトル。 */
  title?: string;
  /** タップ時に表示する吹き出しの説明文。 */
  description?: string;
  /** マーカーの見た目。未指定時は `tourism`（標準ピン）として扱う。 */
  variant?: MapMarkerVariant;
};

export type MapProps = {
  style?: StyleProp<ViewStyle>;
  /**
   * 現在地。指定された場合のみピンを表示する。
   * `null`/`undefined`（取得前・権限拒否など）の場合はピンを出さない。
   */
  currentLocation?: MapCoordinate | null;
  /** 地図上に表示するマーカー一覧（観光スポットなど）。 */
  markers?: MapMarker[];
  /** マーカーがタップされたときのコールバック。 */
  onMarkerPress?: (marker: MapMarker) => void;
  /** 経路として描画する座標列（現在地→目的地の道なり経路など）。 */
  routeCoordinates?: MapCoordinate[];
};
