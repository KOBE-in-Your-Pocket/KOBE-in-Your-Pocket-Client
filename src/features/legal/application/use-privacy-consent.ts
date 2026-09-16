import { useCallback, useEffect, useState } from 'react';

import {
  type ConsentStore,
  isConsentCurrent,
  type PolicyConsent,
  PRIVACY_POLICY_VERSION,
} from '../domain/privacy-policy';

import { defaultConsentStore } from './consent-deps';

/**
 * 同意状態。
 *
 * - `loading`: 端末内の保存値を読み出し中
 * - `required`: 未同意、または同意済みの版数が古い（再同意が必要）
 * - `granted`: 現在の版数に同意済み
 */
export type ConsentStatus = 'loading' | 'required' | 'granted';

export type PrivacyConsent = {
  status: ConsentStatus;
  /**
   * 成人として同意しているか。`status` が `granted` 以外の間は false。
   *
   * 未確定の間を false（制限あり）に倒しているのは、読み出し前に個人情報に関わる
   * 機能が開いてしまうのを防ぐため。
   */
  isAdult: boolean;
  /** 現在の版数への同意を記録する。保存に失敗した場合は状態を変えない。 */
  accept: (isAdult: boolean) => Promise<void>;
};

/**
 * プライバシーポリシーへの同意状態を管理するフック。
 *
 * 起動時に保存済みの同意を読み出し、版数が現在のものと一致する場合のみ `granted` にする。
 * 保存に失敗したまま `granted` にすると次回起動時に再び同意を求めることになり、
 * 「同意した」という記録が残らないため、保存が成功した場合にのみ状態を進める。
 */
export function usePrivacyConsent(store: ConsentStore = defaultConsentStore): PrivacyConsent {
  const [status, setStatus] = useState<ConsentStatus>('loading');
  const [isAdult, setIsAdult] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let consent: PolicyConsent | null = null;
      try {
        consent = await store.loadConsent();
      } catch {
        // 読み出しに失敗した場合は未同意として扱い、同意を求める。
        consent = null;
      }

      if (cancelled) {
        return;
      }

      const granted = isConsentCurrent(consent);
      setIsAdult(granted ? (consent?.isAdult ?? false) : false);
      setStatus(granted ? 'granted' : 'required');
    })();

    return () => {
      cancelled = true;
    };
  }, [store]);

  const accept = useCallback(
    async (acceptedAsAdult: boolean) => {
      await store.saveConsent({
        version: PRIVACY_POLICY_VERSION,
        agreedAt: new Date().toISOString(),
        isAdult: acceptedAsAdult,
      });
      setIsAdult(acceptedAsAdult);
      setStatus('granted');
    },
    [store],
  );

  return { status, isAdult, accept };
}
