import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { fetchSpots } from '../infrastructure/api/spot-api';

import type { Spot } from '../domain/spot';

/** 観光スポット系クエリのキー名前空間。 */
export const SPOTS_QUERY_KEY = ['tourism', 'spots'] as const;

/**
 * 観光スポット一覧を取得する application 層フック。
 *
 * infrastructure の `fetchSpots()` を useQuery でラップし、ui 層には
 * キャッシュ・ローディング・エラー状態を含む宣言的なインターフェースだけを公開する。
 * 実 API への差し替え時も `fetchSpots` のシグネチャが保たれる限りこのフックは変更不要。
 */
export function useSpots() {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);

  return useQuery<Spot[]>({
    queryKey: [...SPOTS_QUERY_KEY, language],
    queryFn: () => fetchSpots(language),
  });
}
