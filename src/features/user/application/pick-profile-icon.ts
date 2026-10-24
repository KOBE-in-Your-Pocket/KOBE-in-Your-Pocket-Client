import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * 選んだ直後の画像。`width` / `height` は回転情報を反映した見た目の寸法（#715 で確認済み）。
 * 寸法を取得できなかった場合は 0 になりうる。
 */
export type PickedProfileIconImage = { uri: string; width: number; height: number };

export type PickProfileIconResult =
  | { status: 'picked'; image: PickedProfileIconImage }
  | { status: 'canceled' };

/**
 * 端末の写真ライブラリからアイコン用の画像を選ぶ（#546）。
 *
 * 加工はせず、ピッカーの結果をそのまま返す。切り抜き・縮小・保存は
 * `cropProfileIcon`、使わなくなった元画像の削除は {@link discardPickedProfileIcon} で行う。
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

  const { uri, width, height } = result.assets[0];
  return { status: 'picked', image: { uri, width, height } };
}

/**
 * 選んだ直後の元画像（フルサイズの一時ファイル）を削除する。
 * 切り抜いて保存したあとや、調整をキャンセルしたときに呼ぶ。
 * 削除に失敗してもキャッシュに残るだけなので、例外は投げない。
 */
export function discardPickedProfileIcon(image: Pick<PickedProfileIconImage, 'uri'>): void {
  try {
    const file = new File(image.uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // キャッシュの掃除に失敗しても選択フロー自体は継続する。
  }
}
