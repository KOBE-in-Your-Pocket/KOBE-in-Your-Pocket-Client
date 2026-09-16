import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useListModeStore, type ListMode } from '../../store/use-list-mode-store';

/**
 * タブナビゲーターで実際にこのタブへ切り替わったタイミングでのみ listMode を更新する。
 * `(tabs)/tourism.tsx` と `(tabs)/evacuation.tsx` はどちらもタブナビゲーターにアンマウント
 * されずに保持されるため、マウント時ではなく「このタブがアクティブになった」タイミングで
 * listMode を設定する必要がある。
 *
 * タブナビゲーター（親）の `state` イベントは、祖先の Stack が別画面を push/pop しただけでも
 * （アクティブなタブ自体は変わっていなくても）発火することがある。そのため「アクティブな
 * タブ名が mode に対応するタブである」ことだけでなく、直前のアクティブタブ名から mode への
 * 「遷移」があった場合のみ listMode を上書きする。これを怠ると、詳細画面（祖先の Stack に
 * push された画面）から router.back() で戻ってきた際にも誤って発火し、トグルで選択していた
 * モードが上書きされてしまう（#416）。
 */
export function useListModeOnTabSwitch(mode: ListMode) {
  const navigation = useNavigation();
  const previousActiveRouteName = useRef<string | undefined>(undefined);

  useEffect(() => {
    const applyModeOnTabSwitch = () => {
      const state = navigation.getState();
      const activeRouteName = state?.routes[state.index]?.name;

      if (activeRouteName === mode && previousActiveRouteName.current !== mode) {
        useListModeStore.getState().setListMode(mode);
      }
      previousActiveRouteName.current = activeRouteName;
    };

    applyModeOnTabSwitch();

    return navigation.addListener('state', applyModeOnTabSwitch);
  }, [navigation, mode]);
}
