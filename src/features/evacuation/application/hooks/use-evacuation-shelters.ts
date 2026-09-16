import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { resolveLanguage } from '@/shared/lib/i18n';

import { getEvacuationSheltersFromLocalDb } from '../use-cases/local-evacuation-shelter-queries';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

/** 避難所系クエリのキー名前空間。 */
export const EVACUATION_SHELTERS_QUERY_KEY = ['evacuation', 'shelters'] as const;

/**
 * 避難所一覧を取得する application 層フック。
 *
 * ローカル SQLite リポジトリ経由で取得する。bootstrap 完了後に DB を読むため、
 * 初回起動時のシード後データもオフラインで閲覧できる。表示言語をクエリキーに
 * 含めることで、言語切り替え時に bootstrap 経由の再シードを含めて再取得する。
 *
 * ここでの言語は `resolveLanguage(i18n.language)`。`useEvacuationDbBootstrap` は
 * 別ソースの `useUiStore.language` を使っており、両者は言語切り替え箇所（
 * `useLanguageBootstrap`・`LanguageSelector`）が必ずセットで更新する不変条件で
 * 一致を保っている。片方だけ更新する変更を入れないこと。
 */
export function useEvacuationShelters() {
  const { i18n } = useTranslation();
  const language = resolveLanguage(i18n.language);

  return useQuery<EvacuationShelter[]>({
    queryKey: [...EVACUATION_SHELTERS_QUERY_KEY, language],
    queryFn: () => getEvacuationSheltersFromLocalDb(language),
  });
}
