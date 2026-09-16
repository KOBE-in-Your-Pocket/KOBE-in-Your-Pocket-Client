import { create } from 'zustand';

import type { SpotGenre } from '../domain/spot';

export type SelectedGenre = SpotGenre | 'all';

type GenreFilterState = {
  selectedGenre: SelectedGenre;
  setSelectedGenre: (genre: SelectedGenre) => void;
};

export const useGenreFilterStore = create<GenreFilterState>((set) => ({
  selectedGenre: 'all',
  setSelectedGenre: (genre) => set({ selectedGenre: genre }),
}));
