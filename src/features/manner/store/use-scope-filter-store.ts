import { create } from 'zustand';

import type { MannerScope } from '../domain/manner-item';

/** 一覧の地域スコープ絞り込みキー。`MannerScope` に「すべて」を加えたもの。 */
export type SelectedScope = MannerScope | 'all';

type ScopeFilterState = {
  selectedScope: SelectedScope;
  setSelectedScope: (scope: SelectedScope) => void;
};

export const useScopeFilterStore = create<ScopeFilterState>((set) => ({
  selectedScope: 'all',
  setSelectedScope: (scope) => set({ selectedScope: scope }),
}));
