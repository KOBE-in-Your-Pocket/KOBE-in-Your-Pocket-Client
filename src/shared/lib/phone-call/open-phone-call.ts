import { Linking } from 'react-native';

/** 発信できない電話番号の理由。ログに残して原因を追えるようにする。 */
export type PhoneNumberIssue =
  /** 未登録（undefined / null / 空白のみ）。 */
  | 'missing'
  /** 数字を 1 つも含まない（例: 「未設定」「-」）。 */
  | 'noDigits';

/** 電話番号が発信できない理由を返す。発信できる番号なら `null`。 */
export function getPhoneNumberIssue(
  phoneNumber: string | null | undefined,
): PhoneNumberIssue | null {
  if (!phoneNumber?.trim()) return 'missing';
  if (!/\d/.test(phoneNumber)) return 'noDigits';
  return null;
}

/**
 * 電話番号から発信用の tel: URL を生成する。
 * 表示用の区切り（ハイフン・空白・括弧など）は取り除き、数字と先頭の + だけを残す。
 */
export function buildTelUrl(phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/**
 * OS の電話アプリを起動して指定の番号に発信する。
 * 発信できない番号では空の `tel:` を開かないよう、理由付きのエラーで reject する。
 */
export async function openPhoneCall(phoneNumber: string): Promise<void> {
  const issue = getPhoneNumberIssue(phoneNumber);
  if (issue) {
    throw new Error(`発信できない電話番号です（${issue}）: ${JSON.stringify(phoneNumber)}`);
  }
  await Linking.openURL(buildTelUrl(phoneNumber));
}
