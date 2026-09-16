import { useKindFilterStore, type SelectedKind } from '../use-kind-filter-store';

describe('useKindFilterStore', () => {
  beforeEach(() => {
    useKindFilterStore.setState({ selectedKind: 'all' });
  });

  describe('初期 state', () => {
    it('selectedKind のデフォルトは all である', () => {
      expect(useKindFilterStore.getState().selectedKind).toBe('all');
    });
  });

  describe('setSelectedKind', () => {
    it.each<SelectedKind>(['all', 'manner', 'rule'])('selectedKind を %s へ更新する', (kind) => {
      useKindFilterStore.getState().setSelectedKind(kind);

      expect(useKindFilterStore.getState().selectedKind).toBe(kind);
    });

    it('連続した呼び出しで最後に指定した種別が反映される', () => {
      const { setSelectedKind } = useKindFilterStore.getState();

      setSelectedKind('manner');
      setSelectedKind('rule');
      setSelectedKind('manner');

      expect(useKindFilterStore.getState().selectedKind).toBe('manner');
    });

    it('setSelectedKind 参照は変化させない', () => {
      const before = useKindFilterStore.getState().setSelectedKind;

      useKindFilterStore.getState().setSelectedKind('rule');

      expect(useKindFilterStore.getState().setSelectedKind).toBe(before);
    });
  });
});
