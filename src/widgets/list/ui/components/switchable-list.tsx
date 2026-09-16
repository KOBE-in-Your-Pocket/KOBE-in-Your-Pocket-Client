import { EvacuationList } from '@/features/evacuation';
import { SpotList } from '@/features/tourism';

import { useListModeStore } from '../../store/use-list-mode-store';

export function SwitchableList() {
  const listMode = useListModeStore((state) => state.listMode);
  return listMode === 'tourism' ? (
    <SpotList showGenreFilter={false} showHeader={false} />
  ) : (
    <EvacuationList showHeader={false} />
  );
}
