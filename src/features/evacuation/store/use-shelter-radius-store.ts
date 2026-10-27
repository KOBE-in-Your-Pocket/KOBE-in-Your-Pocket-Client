import { create } from 'zustand';

import { SHELTER_MAP_RADIUS_KM } from '../application/use-cases/filter-shelters-within-radius';

/** 半径選択の選択肢（km）。`null` は「無制限」（絞り込みなし＝全件表示）を表す。 */
export const SHELTER_RADIUS_OPTIONS_KM = [1, 3, 5, null] as const;
export type ShelterRadiusKm = (typeof SHELTER_RADIUS_OPTIONS_KM)[number];

type ShelterRadiusState = {
  /** 避難所マップの表示半径（km）。デフォルトは `SHELTER_MAP_RADIUS_KM`（1km）。 */
  selectedRadiusKm: ShelterRadiusKm;
  /** 表示半径を設定する。 */
  setSelectedRadiusKm: (radiusKm: ShelterRadiusKm) => void;
};

export const useShelterRadiusStore = create<ShelterRadiusState>((set) => ({
  selectedRadiusKm: SHELTER_MAP_RADIUS_KM,
  setSelectedRadiusKm: (radiusKm) => set({ selectedRadiusKm: radiusKm }),
}));
