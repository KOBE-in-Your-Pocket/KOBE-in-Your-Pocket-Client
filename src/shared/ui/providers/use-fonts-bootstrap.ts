import { DancingScript_600SemiBold } from '@expo-google-fonts/dancing-script';
import { FontDisplay, useFonts } from 'expo-font';
import { useEffect } from 'react';

import { CURSIVE_FONT_FAMILY } from '@/shared/config';

/**
 * 起動時にカスタムフォント（筆記体: Dancing Script）をロードする。
 * ロードキーに `CURSIVE_FONT_FAMILY` を使うため、`Fonts.cursive` の family 名と常に一致する。
 *
 * Web では `font-display: swap`（{@link FontDisplay.SWAP}）を指定する。
 * 既定の AUTO はロード中にテキストを不可視にするため、タイトルが一瞬消える。
 * swap なら端末標準フォントで即座に表示し、ロード完了後に筆記体へ差し替える。
 * （native では display は無視され、フォント未ロード中は標準フォントで表示される。）
 *
 * 失敗時は標準フォントのまま表示を継続し、ログのみ出力する（graceful degradation）。
 * フォントは装飾目的であり、読み込めなくても機能に影響しないため描画はブロックしない。
 */
export function useFontsBootstrap(): boolean {
  const [loaded, error] = useFonts({
    [CURSIVE_FONT_FAMILY]: {
      uri: DancingScript_600SemiBold,
      display: FontDisplay.SWAP,
    },
  });

  useEffect(() => {
    if (error) {
      console.error('[fonts] 筆記体フォントの読み込みに失敗しました（標準フォントで継続）:', error);
    }
  }, [error]);

  return loaded;
}
