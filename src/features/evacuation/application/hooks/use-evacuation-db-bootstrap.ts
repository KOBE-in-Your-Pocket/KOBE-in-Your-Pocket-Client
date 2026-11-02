import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useUiStore } from '@/shared/store';

import { bootstrapEvacuationDatabase } from '../use-cases/bootstrap-evacuation-database';

import { EVACUATION_SHELTERS_QUERY_KEY } from './use-evacuation-shelters';

/**
 * プライバシーポリシーへの同意後に `app/_layout.tsx` の `AppBootstrap` から呼ばれる（#697）。
 * 呼び出し位置が `<I18nextProvider>` の内外どちらでも動くよう、`useTranslation` ではなく
 * `useLanguageBootstrap` と同様 `useUiStore` から言語を読む。
 * 表示言語が変わるたびに再実行し、避難所データの再シードをトリガーする。
 * 再シードで DB が書き換わったら、一覧・詳細・出典のクエリを読み直して画面に反映する（#694）。
 *
 * 不変条件: `useEvacuationShelters`/`useEvacuationShelterDetail` は
 * `resolveLanguage(i18n.language)` を使っており、ここでの `useUiStore.language` とは
 * 別ソース。`useLanguageBootstrap`・`LanguageSelector` が両方を必ずセットで更新するため
 * 実運用では一致するが、どちらか一方だけ更新する変更を入れると、シードした言語と
 * クエリキーの言語がズレて再 bootstrap がちらつく。言語切り替え箇所を追加・変更する際は
 * 両方を同時に更新すること。
 */
export function useEvacuationDbBootstrap(): void {
  const language = useUiStore((state) => state.language);
  const queryClient = useQueryClient();

  useEffect(() => {
    void bootstrapEvacuationDatabase(language)
      .then(({ reseeded }) => reseeded)
      .then((didReseed) =>
        didReseed
          ? queryClient.invalidateQueries({ queryKey: EVACUATION_SHELTERS_QUERY_KEY })
          : undefined,
      )
      .catch((error: unknown) => {
        console.error('[evacuation] Failed to bootstrap local database:', error);
      });
  }, [language, queryClient]);
}
