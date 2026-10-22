import { Linking } from 'react-native';

/**
 * 電話番号から発信用の tel: URL を生成する。
 * 表示用の区切り（ハイフン・空白・括弧など）は取り除き、数字と先頭の + だけを残す。
 */
export function buildTelUrl(phoneNumber: string): string {
  const trimmed = phoneNumber.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/** OS の電話アプリを起動して指定の番号に発信する。 */
export async function openPhoneCall(phoneNumber: string): Promise<void> {
  await Linking.openURL(buildTelUrl(phoneNumber));
}
