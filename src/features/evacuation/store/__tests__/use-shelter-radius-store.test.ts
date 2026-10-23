import { SHELTER_MAP_RADIUS_KM } from '../../application/use-cases/filter-shelters-within-radius';
import { useShelterRadiusStore } from '../use-shelter-radius-store';

beforeEach(() => {
  useShelterRadiusStore.setState({ selectedRadiusKm: SHELTER_MAP_RADIUS_KM });
});

describe('useShelterRadiusStore', () => {
  it('初期値は既定の表示半径（1km）', () => {
    expect(useShelterRadiusStore.getState().selectedRadiusKm).toBe(SHELTER_MAP_RADIUS_KM);
  });

  it.each([1, 3, 5, null] as const)('%s へ更新できる', (radiusKm) => {
    useShelterRadiusStore.getState().setSelectedRadiusKm(radiusKm);

    expect(useShelterRadiusStore.getState().selectedRadiusKm).toBe(radiusKm);
  });
});
