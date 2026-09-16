import { CreditsScreen } from '@/features/legal';

/**
 * クレジット（帰属表示）のルート（`/settings/credits`）。
 *
 * app 層はルーティングのみを担う薄いシェル。画面の中身は legal feature の
 * {@link CreditsScreen} が持つ。
 */
export default function CreditsRoute() {
  return <CreditsScreen />;
}
