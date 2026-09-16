/**
 * 地図・経路・データ提供元のクレジット（帰属表示）。
 *
 * 経路データは OpenRouteService 経由の OpenStreetMap 由来で、ODbL は成果物への
 * 帰属表示を求める。クレジット画面と、経路を描画している地図画面に表示する。
 */
export type Attribution = {
  /** 表示ラベル。ライセンス上そのまま出す必要があるため翻訳しない。 */
  label: string;
  /** 出典・ライセンス条文へのリンク。 */
  url: string;
};

/** 地図に経路を重ねているときに最低限出す帰属表示。 */
export const ROUTING_ATTRIBUTIONS: readonly Attribution[] = [
  { label: '© openrouteservice.org by HeiGIT', url: 'https://openrouteservice.org/' },
  { label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' },
] as const;

/** クレジット画面に並べる帰属表示（経路 + 地図タイル）。 */
export const CREDIT_ATTRIBUTIONS: readonly Attribution[] = [
  ...ROUTING_ATTRIBUTIONS,
  { label: 'Google Maps', url: 'https://www.google.com/intl/ja/help/terms_maps/' },
] as const;
