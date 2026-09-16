import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';

/**
 * 現在有効なプライバシーポリシーの版数。
 *
 * Specification リポジトリの `docs/legal/privacy-policy.*.md` の「版数」と同じ値にする。
 * 本文を改定して再同意が必要になったらこの値を上げる。保存済みの同意がこの値と異なる場合、
 * アプリは起動時に再度同意を求める。
 */
export const PRIVACY_POLICY_VERSION = '2026-09-16';

/**
 * 公開されたプライバシーポリシーのベース URL。
 *
 * App Store Connect / Google Play Console に登録する URL と同一。
 * 公開先を変更する場合は Specification の `docs/legal/README.md` も合わせて更新する。
 */
export const PRIVACY_POLICY_BASE_URL = 'https://kobe-in-your-pocket.github.io/privacy';

/** 端末内に保存する同意記録。 */
export type PolicyConsent = {
  /** 同意した版数。 */
  version: string;
  /** 同意した日時（ISO 8601 拡張形式・UTC）。 */
  agreedAt: string;
  /**
   * {@link ADULT_AGE_THRESHOLD} 歳以上として同意したか。
   *
   * false の場合は個人情報に関わる機能を無効化する。年齢は端末内にのみ保持し、
   * 生年月日など特定につながる値は持たない（必要なのは閾値を超えるか否かだけ）。
   */
  isAdult: boolean;
};

/** 同意記録の永続化ポート。 */
export type ConsentStore = {
  loadConsent: () => Promise<PolicyConsent | null>;
  saveConsent: (consent: PolicyConsent) => Promise<void>;
};

/** 保存済みの同意が現在の版数に対するものかどうかを返す。 */
export function isConsentCurrent(consent: PolicyConsent | null): boolean {
  return consent?.version === PRIVACY_POLICY_VERSION;
}

/**
 * 表示言語に対応するポリシーの公開 URL を返す。
 *
 * 既定言語（en）はベース URL 直下に置かれ、それ以外は言語コードのサブパスに置かれる。
 * 未対応の言語コードが渡された場合は既定言語の URL を返す。
 */
export function privacyPolicyUrl(language: string): string {
  const isSupported = SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
  const resolved = isSupported ? (language as SupportedLanguage) : FALLBACK_LANGUAGE;

  return resolved === FALLBACK_LANGUAGE
    ? `${PRIVACY_POLICY_BASE_URL}/`
    : `${PRIVACY_POLICY_BASE_URL}/${resolved}/`;
}
