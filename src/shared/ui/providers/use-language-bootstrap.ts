import { useEffect } from 'react';

import { initI18n, resolveInitialLanguage } from '@/shared/lib/i18n';
import { useUiStore } from '@/shared/store';

/**
 * 起動時に保存済みの表示言語（無ければデバイス言語）を読み込み、
 * uiStore と i18n の双方へ反映する。
 */
export function useLanguageBootstrap(): void {
  const setLanguage = useUiStore((state) => state.setLanguage);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const language = await resolveInitialLanguage();
      if (cancelled) {
        return;
      }

      setLanguage(language);
      void initI18n().changeLanguage(language);
    })();

    return () => {
      cancelled = true;
    };
  }, [setLanguage]);
}
