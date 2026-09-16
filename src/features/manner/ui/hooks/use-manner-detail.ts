import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { MANNERS_QUERY_KEY } from '../../application/manner-query-keys';
import { useMannerRepository } from '../../application/manner-repository-context';
import { getMannerById } from '../../application/use-cases/get-manner-by-id';

import type { MannerItem } from '../../domain/manner-item';

/**
 * 指定マナー項目の詳細を取得する application 層フック。
 *
 * 詳細取得（{@link getMannerById}）を `mannerId` 込みのキーで呼ぶため、一覧に含まれない
 * 項目でもディープリンクから開ける。{@link useManners} の一覧キャッシュに該当項目があれば
 * placeholder として即座に描画し、裏で詳細を取得して差し替える。
 *
 * `mannerId` が未指定のときは取得しない。該当項目が無ければ `data` は `null`。
 */
export function useMannerDetail(mannerId: string | null | undefined) {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);
  const repository = useMannerRepository();
  const queryClient = useQueryClient();

  return useQuery<MannerItem | null>({
    queryKey: [...MANNERS_QUERY_KEY, 'detail', mannerId, language],
    enabled: Boolean(mannerId),
    queryFn: () => getMannerById(mannerId as string, language, repository),
    placeholderData: () =>
      queryClient
        .getQueryData<MannerItem[]>([...MANNERS_QUERY_KEY, language])
        ?.find((manner) => manner.id === mannerId),
  });
}
