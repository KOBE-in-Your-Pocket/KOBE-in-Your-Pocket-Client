import { act, renderHook } from '@testing-library/react-native';

import { useDisasterFilterStore } from '../../../store/use-disaster-filter-store';
import { useFilteredShelters } from '../use-filtered-shelters';

import type { EvacuationShelter } from '../../../domain/evacuation-shelter';

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockUseEvacuationShelters = jest.fn();

jest.mock('../use-evacuation-shelters', () => ({
  useEvacuationShelters: () => mockUseEvacuationShelters(),
}));

const makeShelter = (
  id: string,
  suitability: EvacuationShelter['suitability'],
): EvacuationShelter => ({
  id,
  name: id,
  address: '',
  coordinates: { latitude: 34.7, longitude: 135.2 },
  type: 'designated',
  facilityCategory: 'school',
  media: { imageUrl: '' },
  accessible: false,
  suitability,
});

const FLOOD = makeShelter('flood', { flood: 'suitable', tsunami: 'unsuitable' });
const TSUNAMI = makeShelter('tsunami', { flood: 'unsuitable', tsunami: 'suitable' });

beforeEach(() => {
  useDisasterFilterStore.setState({ selectedDisasters: [] });
  mockUseEvacuationShelters.mockReturnValue({
    data: [FLOOD, TSUNAMI],
    isPending: false,
    isError: false,
  });
});

describe('useFilteredShelters', () => {
  it('災害種別を選んでいなければ全件を返す', () => {
    const { result } = renderHook(() => useFilteredShelters());

    expect(result.current.data).toEqual([FLOOD, TSUNAMI]);
    expect(result.current.totalCount).toBe(2);
  });

  it('選んだ災害種別で絞り込み、totalCount は絞り込み前の件数を返す', () => {
    const { result } = renderHook(() => useFilteredShelters());

    act(() => {
      useDisasterFilterStore.getState().toggleDisaster('tsunami');
    });

    expect(result.current.data).toEqual([TSUNAMI]);
    expect(result.current.totalCount).toBe(2);
  });

  it('取得前（data が undefined）は undefined のまま返す', () => {
    mockUseEvacuationShelters.mockReturnValue({ data: undefined, isPending: true, isError: false });
    useDisasterFilterStore.setState({ selectedDisasters: ['flood'] });

    const { result } = renderHook(() => useFilteredShelters());

    expect(result.current.data).toBeUndefined();
    expect(result.current.totalCount).toBeUndefined();
    expect(result.current.isPending).toBe(true);
  });
});
