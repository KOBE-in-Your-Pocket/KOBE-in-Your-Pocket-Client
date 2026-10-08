import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** アイコン画像の長辺（px）。backend 側の正規化（512px）に寄せて、無駄なアップロード量を減らす。 */
const ICON_MAX_EDGE_PX = 512;
/** JPEG 圧縮品質（0〜1）。backend のアイコン専用上限（既定 2MB）を十分下回る大きさにする。 */
const ICON_JPEG_COMPRESS = 0.8;

export type PickProfileIconResult =
  | { status: 'picked'; uri: string }
  | { status: 'canceled' }
  | { status: 'permissionDenied' };

/**
 * 端末の写真ライブラリからアイコン用の画像を選び、アップロード用に加工する（#546）。
 *
 * 権限拒否・選択キャンセル時は `canceled`/`permissionDenied` を返すだけで、呼び出し側は
 * アップロードを呼ばなければクラッシュしない。
 */
export async function pickProfileIcon(): Promise<PickProfileIconResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { status: 'permissionDenied' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) {
    return { status: 'canceled' };
  }

  const uri = await normalizeIconImage(result.assets[0]);
  return { status: 'picked', uri };
}

async function normalizeIconImage(asset: { uri: string; width: number; height: number }) {
  const longEdge = Math.max(asset.width, asset.height);
  const scale = longEdge > ICON_MAX_EDGE_PX ? ICON_MAX_EDGE_PX / longEdge : 1;

  const context = ImageManipulator.manipulate(asset.uri);
  if (scale < 1) {
    context.resize({
      width: Math.round(asset.width * scale),
      height: Math.round(asset.height * scale),
    });
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: ICON_JPEG_COMPRESS });
  return saved.uri;
}
