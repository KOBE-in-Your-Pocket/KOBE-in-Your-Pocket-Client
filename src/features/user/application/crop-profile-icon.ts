import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { discardPickedProfileIcon, type PickedProfileIconImage } from './pick-profile-icon';

import type { IconCropRect } from '../domain/icon-crop';

/** アイコン画像の一辺（px）。backend 側の正規化（512px）に寄せて、無駄なアップロード量を減らす。 */
const ICON_EDGE_PX = 512;
/** JPEG 圧縮品質（0〜1）。backend のアイコン専用上限（既定 2MB）を十分下回る大きさにする。 */
const ICON_JPEG_COMPRESS = 0.8;

/**
 * 選んだ画像を切り抜き、512px 四方に縮小して JPEG で保存する。保存した画像の URI を返す。
 *
 * `crop` は元画像の px での切り抜き範囲（`computeIconCropRect` の結果）。
 * 寸法を取得できず範囲を求められなかった場合（null）は切り抜かず、幅だけ指定して
 * 縦横比を保ったまま縮小する（表示側は丸枠に cover で収める）。
 *
 * 保存できたら元画像の一時ファイルを削除する。失敗したときは元画像を残すので、
 * 呼び出し側でやり直すか、{@link discardPickedProfileIcon} で削除する。
 */
export async function cropProfileIcon(
  image: PickedProfileIconImage,
  crop: IconCropRect | null,
): Promise<string> {
  const context = ImageManipulator.manipulate(image.uri);
  if (crop) {
    context.crop(crop);
    context.resize({ width: ICON_EDGE_PX, height: ICON_EDGE_PX });
  } else {
    context.resize({ width: ICON_EDGE_PX });
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: ICON_JPEG_COMPRESS });

  discardPickedProfileIcon(image);

  return saved.uri;
}
