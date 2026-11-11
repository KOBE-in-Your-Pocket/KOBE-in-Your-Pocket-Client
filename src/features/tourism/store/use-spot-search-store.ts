import { create } from 'zustand';

type SpotSearchState = {
  keyword: string;
  setKeyword: (keyword: string) => void;
};

export const useSpotSearchStore = create<SpotSearchState>((set) => ({
  keyword: '',
  setKeyword: (keyword) => set({ keyword }),
}));
