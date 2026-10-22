import { Linking } from 'react-native';

/** 発信できない電話番号の理由。ログに残して原因を追えるようにする。 */
export type PhoneNumberIssue =
  /** 未登録（undefined / null / 空白のみ）。 */
  | 'missing'
  /** 数字を 1 つも含まない（例: 「未設定」「-」）。 */
  | 'noDigits'
  /**
   * 数字と表示用の区切り以外の文字を含む（例: 内線 `078-331-8181,123`、複数番号 `078-331-8181/078-331-8182`）。
   * 区切りを取り除くと別の番号に連結されてしまうため、発信させない。
   */
  | 'unsupportedFormat';

/** 発信できる番号の書式。数字・先頭の `+`・表示用の区切り（ハイフン類・空白・括弧）だけで構成される。 */
const DIALABLE_PATTERN = /^\+?[\d\s\-‐−–—ー－()（）]+$/;

/** 電話番号が発信できない理由を返す。発信できる番号なら `null`。 */
export function getPhoneNumberIssue(
  phoneNumber: string | null | undefined,
): PhoneNumberIssue | null {
  if (!phoneNumber?.trim()) return 'missing';
  if (!/\d/.test(phoneNumber)) return 'noDigits';
  if (!DIALABLE_PATTERN.test(phoneNumber.trim())) return 'unsupportedFormat';
  return null;
}

/**
 * 電話番号から発信用の tel: URL を生成する。
 * 表示用の区切り（ハイフン・空白・括弧など）は取り除き、数字と先頭の + だけを残す。
 * 発信できる番号かどうかは `getPhoneNumberIssue` で事前に確認すること（`openPhoneCall` は確認済み）。
 */
export function buildTelUrl(phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/**
 * OS の電話アプリを起動して指定の番号に発信する。
 *
 * 失敗しても reject せず、原因をログに残して `false` を返す（呼び出し側で catch を書き忘れても
 * 未処理の Promise にならないようにするため）。発信できない番号では電話アプリを開かない。
 *
 * @returns 電話アプリを開けたら `true`
 */
export async function openPhoneCall(phoneNumber: string): Promise<boolean> {
  const issue = getPhoneNumberIssue(phoneNumber);
  if (issue) {
    console.error('[phone-call] 発信できない電話番号のため電話アプリを開きませんでした:', {
      phoneNumber,
      issue,
    });
    return false;
  }

  try {
    await Linking.openURL(buildTelUrl(phoneNumber));
    return true;
  } catch (error: unknown) {
    console.error('[phone-call] 電話アプリを開けませんでした:', error);
    return false;
  }
}
