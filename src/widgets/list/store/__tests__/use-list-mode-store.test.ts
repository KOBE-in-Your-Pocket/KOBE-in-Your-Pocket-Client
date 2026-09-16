import { useListModeStore, type ListMode } from '../use-list-mode-store';

describe('useListModeStore', () => {
  beforeEach(() => {
    useListModeStore.setState({ listMode: 'tourism' });
  });

  describe('初期 state', () => {
    it('listMode のデフォルトは tourism である', () => {
      expect(useListModeStore.getState().listMode).toBe('tourism');
    });
  });

  describe('setListMode', () => {
    it.each<ListMode>(['tourism', 'evacuation'])('listMode を %s へ更新する', (mode) => {
      useListModeStore.getState().setListMode(mode);

      expect(useListModeStore.getState().listMode).toBe(mode);
    });

    it('連続した呼び出しで最後に指定したモードが反映される', () => {
      const { setListMode } = useListModeStore.getState();

      setListMode('evacuation');
      setListMode('tourism');
      setListMode('evacuation');

      expect(useListModeStore.getState().listMode).toBe('evacuation');
    });

    it('setListMode 参照は変化させない', () => {
      const before = useListModeStore.getState().setListMode;

      useListModeStore.getState().setListMode('evacuation');

      expect(useListModeStore.getState().setListMode).toBe(before);
    });
  });
});
