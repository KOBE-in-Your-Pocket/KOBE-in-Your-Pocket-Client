import { create } from 'zustand';

import type { AppMode } from '@/shared/config';

export type ListMode = AppMode;

type ListModeState = {
  listMode: ListMode;
  setListMode: (mode: ListMode) => void;
};

export const useListModeStore = create<ListModeState>((set) => ({
  listMode: 'tourism',
  setListMode: (mode) => set({ listMode: mode }),
}));
