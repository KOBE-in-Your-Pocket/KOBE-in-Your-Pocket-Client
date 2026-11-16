import { Redirect } from 'expo-router';

import { FavoritesScreen } from '@/features/tourism';
import { IS_USER_CONTENT_ENABLED } from '@/shared/config';
import { useIsAdult } from '@/shared/store';

/**
 * お気に入り一覧のルート（`/favorites`、#795）。
 *
 * app 層はルーティングのみを担う薄いシェル。画面の中身は tourism feature の
 * {@link FavoritesScreen} が持つ。
 *
 * お気に入りはログインが前提なので、ログインの導線が無いとき（ユーザー投稿の停止中・
 * 18 歳未満）は出さない。設定画面の入口も消えているが、URL スキーム経由では到達できて
 * しまうためここでも塞ぐ（アカウント編集と同じ）。
 */
export default function FavoritesRoute() {
  const isAdult = useIsAdult();

  if (!IS_USER_CONTENT_ENABLED || !isAdult) {
    return <Redirect href="/(tabs)/settings" />;
  }

  return <FavoritesScreen />;
}
