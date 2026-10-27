/**
 * アイコン調整画面（#714）の位置・大きさから、元画像の切り抜き範囲を求める。
 *
 * 画像の寸法は、回転情報（EXIF Orientation）を反映した見た目の寸法を前提とする。
 * ImagePicker の寸法と ImageManipulator の座標系はどのプラットフォームでも
 * 一致することを #715 で確認済み。
 *
 * 調整中のジェスチャー（UI スレッド）からも呼べるよう、各関数を worklet にしている。
 * `'worklet'` は通常の JS ではただの文字列なので、テストや JS スレッドからも呼べる。
 */

/** 元画像の寸法（px）。 */
export type IconImageSize = { width: number; height: number };

/**
 * 調整画面での画像の置き方。
 * - `scale`：切り抜き枠が画像でちょうど埋まる大きさ（cover 相当）を 1 とした倍率
 * - `translateX` / `translateY`：枠の中心から見た画像の中心のずれ（枠と同じ単位。通常は pt）
 */
export type IconCropTransform = { scale: number; translateX: number; translateY: number };

/** ImageManipulator の `crop` にそのまま渡せる切り抜き範囲（元画像の px）。 */
export type IconCropRect = { originX: number; originY: number; width: number; height: number };

/** 拡大の上限（cover 相当からの倍率）。 */
export const MAX_ICON_ZOOM = 4;

/**
 * 切り抜き範囲の一辺の下限（px）。小さい画像を拡大しすぎてアイコンがぼやけないよう、
 * 拡大の上限をこの値で抑える。アップロード時の長辺（512px）の 1/4。
 */
export const MIN_ICON_CROP_EDGE_PX = 128;

/** 初期状態（cover 相当・中央）。 */
export const INITIAL_ICON_CROP_TRANSFORM: IconCropTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

// worklet は定義した時点で参照先を取り込むため、ほかの worklet から呼ぶ関数は
// 呼び出し元より前に定義する（後ろに書くと巻き上げが効かず undefined になる）。
function clampSymmetric(value: number, limit: number): number {
  'worklet';
  if (!Number.isFinite(value)) {
    return 0;
  }
  const max = Math.max(limit, 0);
  // `+ 0` で -0 を 0 に揃える（max が 0 のとき -0 が返りうる）。
  return Math.min(Math.max(value, -max), max) + 0;
}

function clampRange(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/**
 * 切り抜きの計算に使える寸法か（正の整数）。ImagePicker は寸法を取得できないと 0 を返す。
 * 小数の寸法を通すと切り抜き範囲も小数になるため、整数でなければ使えないものとして扱う。
 */
export function isUsableIconImageSize(image: IconImageSize): boolean {
  'worklet';
  return (
    Number.isInteger(image.width) &&
    Number.isInteger(image.height) &&
    image.width > 0 &&
    image.height > 0
  );
}

/** 切り抜き枠の一辺として使えるか（有限の正の数）。 */
function isUsableIconFrameSize(frameSize: number): boolean {
  'worklet';
  return Number.isFinite(frameSize) && frameSize > 0;
}

/**
 * 拡大の上限。{@link MAX_ICON_ZOOM} を基本に、切り抜き範囲の一辺が
 * {@link MIN_ICON_CROP_EDGE_PX} を下回らない倍率までに抑える（ただし 1 未満にはしない）。
 * 寸法が使えない場合は 1（拡大しない）。
 */
export function getMaxIconZoom(image: IconImageSize): number {
  'worklet';
  if (!isUsableIconImageSize(image)) {
    return 1;
  }
  const shortEdge = Math.min(image.width, image.height);
  return Math.max(1, Math.min(MAX_ICON_ZOOM, shortEdge / MIN_ICON_CROP_EDGE_PX));
}

/** 倍率を 1（cover 相当）〜 {@link getMaxIconZoom} に収める。 */
export function clampIconZoom(scale: number, image: IconImageSize): number {
  'worklet';
  if (!Number.isFinite(scale)) {
    return 1;
  }
  return Math.min(Math.max(scale, 1), getMaxIconZoom(image));
}

/**
 * 倍率と移動量を、切り抜き枠の中に余白ができない範囲に収める。
 * `frameSize` は切り抜き枠の一辺（`translateX` / `translateY` と同じ単位）。
 */
export function clampIconCropTransform(
  transform: IconCropTransform,
  image: IconImageSize,
  frameSize: number,
): IconCropTransform {
  'worklet';
  if (!isUsableIconImageSize(image) || !isUsableIconFrameSize(frameSize)) {
    // 呼び出し側が書き換えても共有の定数が壊れないよう、コピーを返す。
    return { ...INITIAL_ICON_CROP_TRANSFORM };
  }

  const scale = clampIconZoom(transform.scale, image);
  // 枠の一辺 ÷ 短辺 で cover 相当になる。そこに倍率を掛けた大きさで表示している。
  const displayScale = (frameSize / Math.min(image.width, image.height)) * scale;
  const maxX = (image.width * displayScale - frameSize) / 2;
  const maxY = (image.height * displayScale - frameSize) / 2;

  return {
    scale,
    translateX: clampSymmetric(transform.translateX, maxX),
    translateY: clampSymmetric(transform.translateY, maxY),
  };
}

/**
 * 倍率を変えたときの置き方。枠の中心に見えている部分を保ったまま拡大・縮小し、
 * {@link clampIconCropTransform} で枠の中に余白ができない範囲に収める。
 * ボタンやマウスホイールなど、ピンチ以外で倍率を変えるときに使う。
 */
export function zoomIconCropTransform(
  transform: IconCropTransform,
  scale: number,
  image: IconImageSize,
  frameSize: number,
): IconCropTransform {
  'worklet';
  const nextScale = clampIconZoom(scale, image);
  // 元の倍率が壊れていると比率を求められないので、中央に戻す。
  const ratio =
    Number.isFinite(transform.scale) && transform.scale > 0 ? nextScale / transform.scale : 0;
  return clampIconCropTransform(
    {
      scale: nextScale,
      translateX: transform.translateX * ratio,
      translateY: transform.translateY * ratio,
    },
    image,
    frameSize,
  );
}

/**
 * 調整画面での置き方から、元画像の切り抜き範囲（正方形・整数 px）を求める。
 * 範囲外の倍率・移動量は {@link clampIconCropTransform} で収めてから計算するので、
 * 結果は必ず元画像の内側に収まる。寸法が使えない場合は null。
 */
export function computeIconCropRect(
  transform: IconCropTransform,
  image: IconImageSize,
  frameSize: number,
): IconCropRect | null {
  'worklet';
  if (!isUsableIconImageSize(image) || !isUsableIconFrameSize(frameSize)) {
    return null;
  }

  const clamped = clampIconCropTransform(transform, image, frameSize);
  const shortEdge = Math.min(image.width, image.height);
  // 表示上の 1 単位が元画像の何 px に当たるか。
  const pxPerUnit = shortEdge / (frameSize * clamped.scale);

  const edge = Math.min(Math.max(Math.round(shortEdge / clamped.scale), 1), shortEdge);
  // 画像を右・下へずらすと、枠に映る部分は元画像の左・上側になる。
  const centerX = image.width / 2 - clamped.translateX * pxPerUnit;
  const centerY = image.height / 2 - clamped.translateY * pxPerUnit;

  return {
    originX: clampRange(Math.round(centerX - edge / 2), 0, image.width - edge),
    originY: clampRange(Math.round(centerY - edge / 2), 0, image.height - edge),
    width: edge,
    height: edge,
  };
}
