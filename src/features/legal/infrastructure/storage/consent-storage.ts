import type { PolicyConsent } from '../../domain/privacy-policy';

import { getItem, setItem } from '@/shared/lib/storage';

/** プライバシーポリシーへの同意記録を AsyncStorage に保存する際のキー。 */
export const CONSENT_STORAGE_KEY = 'legal.privacyPolicyConsent';

/**
 * 保存済みの同意記録を読み出す。未保存・形式不正の場合は null を返す。
 *
 * 年齢確認の追加より前に保存された記録は `isAdult` を持たない。これを「同意済み」として
 * 扱うと年齢を尋ねる機会が無いまま個人情報に関わる機能を開けてしまうため、形式不正と
 * 同じく null にして再同意を求める。移行のために一度だけ同意画面が出る。
 */
export async function loadConsent(): Promise<PolicyConsent | null> {
  const stored = await getItem<Partial<PolicyConsent>>(CONSENT_STORAGE_KEY);

  if (
    typeof stored?.version !== 'string' ||
    typeof stored.agreedAt !== 'string' ||
    typeof stored.isAdult !== 'boolean'
  ) {
    return null;
  }

  return { version: stored.version, agreedAt: stored.agreedAt, isAdult: stored.isAdult };
}

/** 同意記録を保存する。 */
export async function saveConsent(consent: PolicyConsent): Promise<void> {
  await setItem(CONSENT_STORAGE_KEY, consent);
}
