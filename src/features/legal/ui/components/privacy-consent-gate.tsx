import { type PropsWithChildren, useEffect } from 'react';

import { usePrivacyConsent } from '../../application/use-privacy-consent';

import { PrivacyConsentScreen } from './privacy-consent-screen';

import { useAgeRestrictionStore } from '@/shared/store';

/**
 * プライバシーポリシーへの同意を得るまで子要素を描画しないゲート。
 *
 * 未同意の間はアプリ本体（ルーティング・API 呼び出し）を一切マウントしない。
 * 読み出し中は起動スプラッシュが覆っているため何も描画しない。
 *
 * あわせて、同意時に答えた年齢区分を shared store へ流し込む。`shared/lib/geo` など
 * shared 配下から参照する必要がある一方、`shared/` から `features/` は参照できないため
 * （`docs/directory-structure.md` §7）、feature 側のこの層が書き込み役を担う。
 */
export function PrivacyConsentGate({ children }: PropsWithChildren) {
  const { status, isAdult, accept } = usePrivacyConsent();
  const setIsAdult = useAgeRestrictionStore((state) => state.setIsAdult);

  useEffect(() => {
    if (status === 'granted') {
      setIsAdult(isAdult);
    }
  }, [status, isAdult, setIsAdult]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'required') {
    return <PrivacyConsentScreen onAccept={accept} />;
  }

  return <>{children}</>;
}
