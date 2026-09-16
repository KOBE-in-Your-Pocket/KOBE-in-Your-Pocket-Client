import type { PublicUser } from './public-user';

/** アカウント編集画面で編集できる項目。 */
export type ProfileEdits = Pick<PublicUser, 'name' | 'iconUrl'>;

/** 表示名の最大文字数。 */
export const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * 表示名として保存できるか（前後空白を除いて 1〜{@link MAX_DISPLAY_NAME_LENGTH} 文字）。
 * 絵文字などサロゲートペアを 1 文字と数えるため、コードポイント数で判定する。
 */
export function isValidDisplayName(name: string): boolean {
  const length = [...name.trim()].length;
  return length > 0 && length <= MAX_DISPLAY_NAME_LENGTH;
}

/** 編集内容を保存可能な形（表示名 trim 済み）に正規化する。不正な場合は null。 */
export function normalizeProfileEdits(edits: ProfileEdits): ProfileEdits | null {
  if (!isValidDisplayName(edits.name)) {
    return null;
  }

  return { name: edits.name.trim(), iconUrl: edits.iconUrl };
}
