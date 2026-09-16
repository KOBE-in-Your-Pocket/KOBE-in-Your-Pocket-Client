import { renderHook } from '@testing-library/react-native';

import { useListModeOnTabSwitch } from '../use-list-mode-on-tab-switch';

import { useListModeStore } from '../../../store/use-list-mode-store';

type StateListener = () => void;

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockUseNavigation = jest.fn();

jest.mock('expo-router', () => ({
  useNavigation: () => mockUseNavigation(),
}));

/**
 * expo-router/react-navigation のタブナビゲーターを模したフェイク。
 * `switchTo` で「タブナビゲーター自身の state が変化した」ことをシミュレートする。
 * 「祖先 Stack の push/pop だけで state イベントが発火し、アクティブなタブ名は
 * 変わらない」ケース（#416）は `switchTo` に同じルート名を渡すことで再現できる。
 */
function createFakeTabNavigation(initialRouteName: string) {
  let activeRouteName = initialRouteName;
  let listener: StateListener | undefined;

  return {
    getState: jest.fn(() => ({
      index: 0,
      routes: [{ name: activeRouteName }],
    })),
    addListener: jest.fn((event: string, callback: StateListener) => {
      if (event === 'state') listener = callback;
      return jest.fn();
    }),
    switchTo: (routeName: string) => {
      activeRouteName = routeName;
      listener?.();
    },
  };
}

describe('useListModeOnTabSwitch', () => {
  beforeEach(() => {
    mockUseNavigation.mockReset();
  });

  it('マウント時にアクティブなタブが mode と一致する場合は listMode を設定する', () => {
    useListModeStore.setState({ listMode: 'tourism' });
    const navigation = createFakeTabNavigation('evacuation');
    mockUseNavigation.mockReturnValue(navigation);

    renderHook(() => useListModeOnTabSwitch('evacuation'));

    expect(useListModeStore.getState().listMode).toBe('evacuation');
  });

  it('マウント時にアクティブなタブが mode と異なる場合は listMode を変更しない', () => {
    useListModeStore.setState({ listMode: 'evacuation' });
    const navigation = createFakeTabNavigation('map');
    mockUseNavigation.mockReturnValue(navigation);

    renderHook(() => useListModeOnTabSwitch('tourism'));

    expect(useListModeStore.getState().listMode).toBe('evacuation');
  });

  it('タブが実際に切り替わったときは listMode を更新する', () => {
    useListModeStore.setState({ listMode: 'evacuation' });
    const navigation = createFakeTabNavigation('map');
    mockUseNavigation.mockReturnValue(navigation);

    renderHook(() => useListModeOnTabSwitch('tourism'));
    expect(useListModeStore.getState().listMode).toBe('evacuation');

    navigation.switchTo('tourism');

    expect(useListModeStore.getState().listMode).toBe('tourism');
  });

  it('アクティブなタブ名が変わらない state イベント（祖先 Stack の push/pop 等）では listMode を上書きしない（#416）', () => {
    useListModeStore.setState({ listMode: 'tourism' });
    const navigation = createFakeTabNavigation('tourism');
    mockUseNavigation.mockReturnValue(navigation);

    renderHook(() => useListModeOnTabSwitch('tourism'));
    expect(useListModeStore.getState().listMode).toBe('tourism');

    // トグル操作でユーザーが evacuation を選択（このフックの外側で listMode が変わる）。
    useListModeStore.getState().setListMode('evacuation');

    // 詳細画面から戻ってきた際などにアクティブなタブ名は変わらないまま state イベントが発火する。
    navigation.switchTo('tourism');

    expect(useListModeStore.getState().listMode).toBe('evacuation');
  });

  it('unmount 時に state リスナーを解除する', () => {
    useListModeStore.setState({ listMode: 'tourism' });
    const navigation = createFakeTabNavigation('tourism');
    mockUseNavigation.mockReturnValue(navigation);

    const { unmount } = renderHook(() => useListModeOnTabSwitch('tourism'));
    const unsubscribe = navigation.addListener.mock.results[0].value as jest.Mock;

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
