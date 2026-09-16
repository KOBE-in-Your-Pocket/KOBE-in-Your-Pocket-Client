import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { getEvacuationShelterByIdFromLocalDb } from '../use-cases/local-evacuation-shelter-queries';

import { EVACUATION_SHELTERS_QUERY_KEY } from './use-evacuation-shelters';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

/**
 * ID 指定で避難所詳細（名称・住所・収容人数・種類など）を取得する application 層フック。
 * ローカル SQLite リポジトリの `findById` 経由で取得する。
 * `shelterId` 未指定時は取得せず、該当が無ければ `data` は `undefined`。
 * 表示言語をクエリキーに含め、言語切り替え時に再取得する。言語ソースの不変条件に
 * ついては `useEvacuationShelters` の doc コメントを参照。
 */
export function useEvacuationShelterDetail(shelterId: string | null | undefined) {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);

  return useQuery<EvacuationShelter | null, Error, EvacuationShelter | undefined>({
    queryKey: [...EVACUATION_SHELTERS_QUERY_KEY, language, shelterId],
    enabled: Boolean(shelterId),
    queryFn: () => getEvacuationShelterByIdFromLocalDb(shelterId!, language),
    select: (shelter) => shelter ?? undefined,
  });
}
