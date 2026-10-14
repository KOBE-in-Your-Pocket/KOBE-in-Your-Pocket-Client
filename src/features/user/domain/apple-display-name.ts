/** backend のプロフィール表示名の最大長（User.MAX_NAME_LENGTH）。超過は 400 になる。 */
export const MAX_DISPLAY_NAME_LENGTH = 100;

/**
 * Apple から受け取った表示名を backend へ送れる形に整える。
 * 前後の空白を除き、空なら null、最大長を超える分は切り詰める。
 * backend（Kotlin）の長さ検証は UTF-16 単位のため、こちらも UTF-16 単位で数え、
 * サロゲートペアの途中では切らない。
 */
export function normalizeAppleDisplayName(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= MAX_DISPLAY_NAME_LENGTH) {
    return trimmed;
  }

  let truncated = trimmed.slice(0, MAX_DISPLAY_NAME_LENGTH);
  const lastCode = truncated.charCodeAt(truncated.length - 1);
  if (lastCode >= 0xd800 && lastCode <= 0xdbff) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.trim() || null;
}
