import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import type { MannerItem } from '../domain/manner-item';

import { MANNERS_QUERY_KEY } from './manner-query-keys';
import { useMannerRepository } from './manner-repository-context';
import { getManners } from './use-cases/get-manners';
import { getSpotManners } from './use-cases/get-spot-manners';

/**
 * 指定スポットに紐づくマナー項目を取得する application 層フック。
 *
 * スポット単位の取得 API はまだ無いため、一覧取得（{@link getManners}）の結果を
 * `useManners` と同じクエリキーで共有しつつ `select` で絞り込む。
 * 一覧を表示済みなら追加のネットワーク取得なしにスポット固有のマナーを引ける。
 *
 * `spotId` が未指定のときは取得しない。該当マナーが無ければ `data` は空配列。
 */
export function useSpotManners(spotId: string | null | undefined) {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);
  const repository = useMannerRepository();

  return useQuery<MannerItem[], Error, MannerItem[]>({
    queryKey: [...MANNERS_QUERY_KEY, language],
    enabled: Boolean(spotId),
    queryFn: () => getManners(language, repository),
    select: (manners) => (spotId ? getSpotManners(spotId, manners) : []),
  });
}
