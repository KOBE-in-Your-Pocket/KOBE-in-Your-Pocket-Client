import type { MannerItem } from '../../domain/manner-item';
import type { SelectedKind } from '../../store/use-kind-filter-store';
import type { SelectedScope } from '../../store/use-scope-filter-store';

/**
 * マナー項目一覧を selectedKind で絞り込む純粋関数。
 * 'all' のときは全件をそのまま返す。
 */
export function filterMannersByKind(manners: MannerItem[], kind: SelectedKind): MannerItem[] {
  if (kind === 'all') return manners;
  return manners.filter((manner) => manner.kind === kind);
}

/**
 * マナー項目一覧を selectedScope で絞り込む純粋関数。
 * 'all' のときは全件をそのまま返す。
 */
export function filterMannersByScope(manners: MannerItem[], scope: SelectedScope): MannerItem[] {
  if (scope === 'all') return manners;
  return manners.filter((manner) => manner.scope === scope);
}
