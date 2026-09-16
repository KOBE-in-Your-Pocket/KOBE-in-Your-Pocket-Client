import { create } from 'zustand';

import { resolveLanguage, type SupportedLanguage } from '@/shared/lib/i18n';

export type UiState = {
  /** 現在選択中の表示言語 */
  language: SupportedLanguage;
  /** 表示言語を切り替える */
  setLanguage: (language: SupportedLanguage) => void;
};

export const useUiStore = create<UiState>((set) => ({
  language: resolveLanguage(),
  setLanguage: (language) => set({ language }),
}));
