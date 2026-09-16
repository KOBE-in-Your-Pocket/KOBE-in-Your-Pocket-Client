import { useLocalSearchParams } from 'expo-router';

import { SpotDetailScreen } from '@/features/tourism';

/**
 * 観光スポット詳細の動的ルート（`/tourism/[id]`）。
 *
 * app 層はルーティングのみを担い、URL の `id` パラメータを取り出して
 * feature 層の {@link SpotDetailScreen} へ委譲する。データ取得・表示ロジックは持たない。
 */
export default function SpotDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SpotDetailScreen spotId={id} />;
}
