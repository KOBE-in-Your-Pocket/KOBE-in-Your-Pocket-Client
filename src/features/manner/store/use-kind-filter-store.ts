import { create } from 'zustand';

import type { MannerKind } from '../domain/manner-item';

/** マナー一覧の種別フィルタ選択値。`all` は全種別（マナー・ルール）を表す。 */
export type SelectedKind = MannerKind | 'all';

type KindFilterState = {
  selectedKind: SelectedKind;
  setSelectedKind: (kind: SelectedKind) => void;
};

export const useKindFilterStore = create<KindFilterState>((set) => ({
  selectedKind: 'all',
  setSelectedKind: (kind) => set({ selectedKind: kind }),
}));
