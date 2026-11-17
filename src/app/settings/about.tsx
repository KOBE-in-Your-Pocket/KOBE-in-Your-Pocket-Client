import { AboutScreen } from '@/features/legal';

/**
 * 「このアプリについて」のルート（`/settings/about`）。
 *
 * app 層はルーティングのみを担う薄いシェル。画面の中身は legal feature の
 * {@link AboutScreen} が持つ。設定画面のハンバーガーメニューから遷移する（#771）。
 */
export default function AboutRoute() {
  return <AboutScreen />;
}
