import { GenreFilter } from '@/features/tourism';

import { useListModeStore } from '../../store/use-list-mode-store';

export function ListGenreFilter() {
  const listMode = useListModeStore((state) => state.listMode);
  return listMode === 'tourism' ? <GenreFilter /> : null;
}
