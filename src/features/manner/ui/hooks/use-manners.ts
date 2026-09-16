import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { MANNERS_QUERY_KEY } from '../../application/manner-query-keys';
import { useMannerRepository } from '../../application/manner-repository-context';
import { getManners } from '../../application/use-cases/get-manners';

import type { MannerItem } from '../../domain/manner-item';

/**
 * マナー項目一覧を取得する UI hook。
 *
 * {@link getManners} ユースケースを useQuery でラップする。Repository 実装は
 * {@link MannerRepositoryProvider} 経由で注入されるため、ui 層は infrastructure を直接参照しない。
 */
export function useManners() {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);
  const repository = useMannerRepository();

  return useQuery<MannerItem[]>({
    queryKey: [...MANNERS_QUERY_KEY, language],
    queryFn: () => getManners(language, repository),
  });
}
