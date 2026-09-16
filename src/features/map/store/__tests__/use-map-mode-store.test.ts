import { useMapModeStore, type MapMode } from '../use-map-mode-store';

describe('useMapModeStore', () => {
  beforeEach(() => {
    useMapModeStore.setState({ mapMode: 'tourism' });
  });

  describe('初期 state', () => {
    it('mapMode のデフォルトは tourism である', () => {
      expect(useMapModeStore.getState().mapMode).toBe('tourism');
    });
  });

  describe('setMapMode', () => {
    it.each<MapMode>(['tourism', 'evacuation'])('mapMode を %s へ更新する', (mode) => {
      useMapModeStore.getState().setMapMode(mode);

      expect(useMapModeStore.getState().mapMode).toBe(mode);
    });

    it('連続した呼び出しで最後に指定したモードが反映される', () => {
      const { setMapMode } = useMapModeStore.getState();

      setMapMode('evacuation');
      setMapMode('tourism');
      setMapMode('evacuation');

      expect(useMapModeStore.getState().mapMode).toBe('evacuation');
    });

    it('setMapMode 参照は変化させない', () => {
      const before = useMapModeStore.getState().setMapMode;

      useMapModeStore.getState().setMapMode('evacuation');

      expect(useMapModeStore.getState().setMapMode).toBe(before);
    });
  });
});
