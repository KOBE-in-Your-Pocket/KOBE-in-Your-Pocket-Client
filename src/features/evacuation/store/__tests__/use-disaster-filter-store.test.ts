import { useDisasterFilterStore } from '../use-disaster-filter-store';

beforeEach(() => {
  useDisasterFilterStore.setState({ selectedDisasters: [] });
});

describe('useDisasterFilterStore', () => {
  it('初期状態では何も選択していない', () => {
    expect(useDisasterFilterStore.getState().selectedDisasters).toEqual([]);
  });

  it('未選択の災害種別を切り替えると選択に加わる', () => {
    useDisasterFilterStore.getState().toggleDisaster('flood');

    expect(useDisasterFilterStore.getState().selectedDisasters).toEqual(['flood']);
  });

  it('複数の災害種別を同時に選択できる', () => {
    useDisasterFilterStore.getState().toggleDisaster('flood');
    useDisasterFilterStore.getState().toggleDisaster('tsunami');

    expect(useDisasterFilterStore.getState().selectedDisasters).toEqual(['flood', 'tsunami']);
  });

  it('選択済みの災害種別を切り替えると選択から外れる', () => {
    useDisasterFilterStore.getState().toggleDisaster('flood');
    useDisasterFilterStore.getState().toggleDisaster('tsunami');
    useDisasterFilterStore.getState().toggleDisaster('flood');

    expect(useDisasterFilterStore.getState().selectedDisasters).toEqual(['tsunami']);
  });
});
