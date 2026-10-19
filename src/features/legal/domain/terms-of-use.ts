import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';

/**
 * 現在有効な利用規約の版数。
 *
 * Specification リポジトリの `docs/legal/terms-of-use.*.md` の「版数」と同じ値にする。
 * 本文を改定して再同意が必要になったらこの値を上げる。保存済みの同意がこの値と異なる場合、
 * アプリは起動時に再度同意を求める（プライバシーポリシーと同じ運用）。
 *
 * App Store Guideline 1.2 は、ユーザー投稿コンテンツを持つアプリに「不適切なコンテンツと
 * 悪質な利用者を一切容認しない旨の規約」への同意を求める（#665）。
 */
export const TERMS_OF_USE_VERSION = '2026-10-16';

/** 公開された利用規約のベース URL。プライバシーポリシーと同じ GitHub Pages に置く。 */
export const TERMS_OF_USE_BASE_URL = 'https://kobe-in-your-pocket.github.io/terms';

/**
 * 表示言語に対応する利用規約の公開 URL を返す。
 *
 * 既定言語（en）はベース URL 直下に置かれ、それ以外は言語コードのサブパスに置かれる。
 * 未対応の言語コードが渡された場合は既定言語の URL を返す。
 */
export function termsOfUseUrl(language: string): string {
  const isSupported = SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
  const resolved = isSupported ? (language as SupportedLanguage) : FALLBACK_LANGUAGE;

  return resolved === FALLBACK_LANGUAGE
    ? `${TERMS_OF_USE_BASE_URL}/`
    : `${TERMS_OF_USE_BASE_URL}/${resolved}/`;
}
