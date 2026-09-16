import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { fetchSpotById } from '../infrastructure/api/spot-api';

import { SPOTS_QUERY_KEY } from './use-spots';

import type { Spot } from '../domain/spot';

/**
 * 指定スポットの詳細を取得する application 層フック。
 *
 * 詳細エンドポイント（{@link fetchSpotById}）を `spotId` 込みのキーで呼ぶため、
 * 一覧に含まれないスポットでもディープリンクから開ける。
 * {@link useSpots} の一覧キャッシュに該当スポットがあれば placeholder として
 * 即座に描画し、裏で詳細を取得して差し替える。
 *
 * `spotId` が未指定のときは取得しない。該当スポットが無ければ（404）`data` は `null`。
 */
export function useSpotDetail(spotId: string | null | undefined) {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);
  const queryClient = useQueryClient();

  return useQuery<Spot | null>({
    queryKey: [...SPOTS_QUERY_KEY, 'detail', spotId, language],
    enabled: Boolean(spotId),
    queryFn: () => fetchSpotById(spotId as string, language),
    placeholderData: () =>
      queryClient
        .getQueryData<Spot[]>([...SPOTS_QUERY_KEY, language])
        ?.find((spot) => spot.id === spotId),
  });
}
