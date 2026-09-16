import { useLocalSearchParams } from 'expo-router';

import { EvacuationShelterDetailScreen } from '@/features/evacuation';

/**
 * 避難所詳細の動的ルート（`/evacuation/[id]`）。
 * app 層はルーティングのみを担い、URL の `id` を feature 層の画面へ委譲する。
 */
export default function EvacuationShelterDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EvacuationShelterDetailScreen shelterId={id} />;
}
