import { DisasterFilter } from '@/features/evacuation';
import { GenreFilter } from '@/features/tourism';

import { useListModeStore } from '../../store/use-list-mode-store';

/**
 * リストタブの固定ヘッダーに出す絞り込みチップ。
 * 観光モードではジャンル、避難所モードでは災害種別のチップを出す。
 * リストと一緒にスクロールしないよう、各リストには `showGenreFilter` / `showDisasterFilter` を
 * false で渡し、ここで出す。
 */
export function ListGenreFilter() {
  const listMode = useListModeStore((state) => state.listMode);
  return listMode === 'tourism' ? <GenreFilter /> : <DisasterFilter />;
}
