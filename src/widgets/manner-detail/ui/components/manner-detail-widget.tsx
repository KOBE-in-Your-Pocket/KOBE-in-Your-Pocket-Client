import { MannerDetailScreen } from '@/features/manner';
import { useSpots } from '@/features/tourism';

/**
 * マナー詳細画面を、関連スポット表示に必要な観光スポット取得（tourism）と合成する widget。
 *
 * manner と tourism という複数 feature をまたぐ取得・合成をここ（widgets 層）に閉じ込め、
 * `useSpots()` の取得状態（data/isPending/isError）をそのまま {@link MannerDetailScreen} の
 * `relatedSpots` として渡す。app 層のルートは `mannerId` を渡すだけの薄いシェルに保つ。
 */
export function MannerDetailWidget({ mannerId }: { mannerId: string }) {
  const { data: spots, isPending, isError } = useSpots();

  return (
    <MannerDetailScreen mannerId={mannerId} relatedSpots={{ data: spots, isPending, isError }} />
  );
}
