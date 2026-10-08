import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** アイコン画像の長辺（px）。backend 側の正規化（512px）に寄せて、無駄なアップロード量を減らす。 */
const ICON_MAX_EDGE_PX = 512;
/** JPEG 圧縮品質（0〜1）。backend のアイコン専用上限（既定 2MB）を十分下回る大きさにする。 */
const ICON_JPEG_COMPRESS = 0.8;

export type PickProfileIconResult = { status: 'picked'; uri: string } | { status: 'canceled' };

/**
 * 端末の写真ライブラリからアイコン用の画像を選び、アップロード用に加工する（#546）。
 *
 * SDK 56 の画像選択は事前の権限リクエストを必要としない（必要な場合は
 * `launchImageLibraryAsync` が内部で処理する）ため、ここでは要求しない。
 * 選択キャンセル・失敗時は `canceled`/例外を返すだけで、呼び出し側は
 * アップロードを呼ばなければクラッシュしない。
 */
export async function pickProfileIcon(): Promise<PickProfileIconResult> {
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
  const context = ImageManipulator.manipulate(asset.uri);
  const longEdge = Math.max(asset.width, asset.height);

  if (longEdge <= 0) {
    // 寸法を取得できない場合でも、片辺だけ指定して ImageManipulator に比率計算を
    // 任せる（手元で両辺を計算すると極端な縦横比で 0px に丸まりうる）。
    context.resize({ width: ICON_MAX_EDGE_PX });
  } else if (longEdge > ICON_MAX_EDGE_PX) {
    if (asset.width >= asset.height) {
      context.resize({ width: ICON_MAX_EDGE_PX });
    } else {
      context.resize({ height: ICON_MAX_EDGE_PX });
    }
  }

  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: ICON_JPEG_COMPRESS });

  // 縮小・再エンコード後は選択直後の元画像（フルサイズ）が不要になる。削除に
  // 失敗してもキャッシュに残るだけなので、選択自体は成功として扱う。
  deleteLocalFileQuietly(asset.uri);

  return saved.uri;
}

function deleteLocalFileQuietly(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // キャッシュの掃除に失敗しても選択フロー自体は継続する。
  }
}
