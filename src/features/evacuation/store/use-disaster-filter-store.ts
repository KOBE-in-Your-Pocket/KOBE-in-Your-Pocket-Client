import { create } from 'zustand';

import type { DisasterType } from '../domain/evacuation-shelter';

type DisasterFilterState = {
  /** 絞り込みに使う災害種別。空のときは絞り込まない（全件表示）。 */
  selectedDisasters: DisasterType[];
  /** 災害種別の選択を切り替える。選択済みなら外し、未選択なら加える。 */
  toggleDisaster: (disaster: DisasterType) => void;
};

export const useDisasterFilterStore = create<DisasterFilterState>((set) => ({
  selectedDisasters: [],
  toggleDisaster: (disaster) =>
    set((state) => ({
      selectedDisasters: state.selectedDisasters.includes(disaster)
        ? state.selectedDisasters.filter((selected) => selected !== disaster)
        : [...state.selectedDisasters, disaster],
    })),
}));
