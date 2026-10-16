import { isConsentCurrent, PRIVACY_POLICY_VERSION, privacyPolicyUrl } from '../privacy-policy';
import { TERMS_OF_USE_VERSION } from '../terms-of-use';

describe('isConsentCurrent', () => {
  it('現在の版数と一致する場合のみ true', () => {
    expect(
      isConsentCurrent({
        version: PRIVACY_POLICY_VERSION,
        termsVersion: TERMS_OF_USE_VERSION,
        agreedAt: '2026-09-07T00:00:00.000Z',
        isAdult: true,
      }),
    ).toBe(true);
    expect(
      isConsentCurrent({
        version: '2000-01-01',
        termsVersion: TERMS_OF_USE_VERSION,
        agreedAt: '2000-01-01T00:00:00.000Z',
        isAdult: true,
      }),
    ).toBe(false);
    expect(isConsentCurrent(null)).toBe(false);
  });

  it('利用規約の版数が無い・古い記録は現在の同意とみなさない（#665）', () => {
    const base = {
      version: PRIVACY_POLICY_VERSION,
      agreedAt: '2026-09-07T00:00:00.000Z',
      isAdult: true,
    };

    expect(isConsentCurrent({ ...base, termsVersion: null })).toBe(false);
    expect(isConsentCurrent({ ...base, termsVersion: '2000-01-01' })).toBe(false);
  });

  it('年齢区分は版数の判定に影響しない', () => {
    // 未成年として同意した記録も「現在の版数に同意済み」であり、再同意は不要。
    // 年齢による機能制限は、同意が最新かどうかとは別の軸で判断する。
    expect(
      isConsentCurrent({
        version: PRIVACY_POLICY_VERSION,
        termsVersion: TERMS_OF_USE_VERSION,
        agreedAt: '2026-09-07T00:00:00.000Z',
        isAdult: false,
      }),
    ).toBe(true);
  });
});

describe('privacyPolicyUrl', () => {
  it('既定言語（en）はベース URL 直下を返す', () => {
    expect(privacyPolicyUrl('en')).toBe('https://kobe-in-your-pocket.github.io/privacy/');
  });

  it('対応言語は言語コードのサブパスを返す', () => {
    expect(privacyPolicyUrl('ja')).toBe('https://kobe-in-your-pocket.github.io/privacy/ja/');
    expect(privacyPolicyUrl('ko')).toBe('https://kobe-in-your-pocket.github.io/privacy/ko/');
    expect(privacyPolicyUrl('zh')).toBe('https://kobe-in-your-pocket.github.io/privacy/zh/');
  });

  it('未対応の言語は既定言語の URL へフォールバックする', () => {
    expect(privacyPolicyUrl('fr')).toBe('https://kobe-in-your-pocket.github.io/privacy/');
  });
});
