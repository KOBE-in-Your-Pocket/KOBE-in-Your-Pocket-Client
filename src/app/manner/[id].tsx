import { useLocalSearchParams } from 'expo-router';

import { MannerDetailWidget } from '@/widgets/manner-detail';

/**
 * マナー項目詳細の動的ルート（`/manner/[id]`）。
 *
 * app 層はルーティングのみを担う薄いシェル。URL の `id` を取り出して
 * {@link MannerDetailWidget} へ渡すだけで、複数 feature の取得・合成は widget 層に閉じる。
 */
export default function MannerDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <MannerDetailWidget mannerId={id} />;
}
