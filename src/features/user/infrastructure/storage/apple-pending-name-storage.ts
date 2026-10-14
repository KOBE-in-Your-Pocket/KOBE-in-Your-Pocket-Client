import * as SecureStore from 'expo-secure-store';

import type { PendingAppleName } from '../../domain/auth-ports';

/**
 * Apple が初回のみ返す表示名の一時保存（expo-secure-store）。
 *
 * backend へのサインインが成功するまで保持し、失敗・アプリ終了後の再試行でも再送できるようにする。
 * 氏名は個人情報のため AsyncStorage ではなく Keychain に置く。
 */

const PENDING_APPLE_NAME_KEY = 'auth.pendingAppleName';

/** 表示名を保存する。Apple から fullName を受け取った直後に呼ぶ。 */
export async function savePendingAppleName(pending: PendingAppleName): Promise<void> {
  await SecureStore.setItemAsync(PENDING_APPLE_NAME_KEY, JSON.stringify(pending));
}

/** 保存済みの表示名を読み出す。未保存・パース不能の場合は null を返す。 */
export async function loadPendingAppleName(): Promise<PendingAppleName | null> {
  const raw = await SecureStore.getItemAsync(PENDING_APPLE_NAME_KEY);
  if (raw === null) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingAppleName;
    if (typeof parsed?.appleUserId !== 'string' || typeof parsed.name !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** 保存済みの表示名を削除する。backend へのサインイン成功時に呼ぶ。 */
export async function clearPendingAppleName(): Promise<void> {
  await SecureStore.deleteItemAsync(PENDING_APPLE_NAME_KEY);
}
