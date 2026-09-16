/**
 * 利用者からの問い合わせ窓口 URL。
 *
 * App Store Guideline 1.2 は、UGC を扱うアプリに開発者への連絡手段の提供を求める。
 * v1 は UGC を出さないため必須ではないが、プライバシーポリシー第 7 章の請求窓口として
 * 到達手段を 1 つは公開しておく必要がある。
 *
 * 窓口は Google フォーム。GitHub Issues から移したのは、GitHub アカウントを持たない
 * 利用者（主対象である訪日外国人を含む）が到達できないため（チーム決定・2026-09-16）。
 *
 * 差し替える場合は Specification の `docs/legal/privacy-policy.*.md` 第 1 章と、
 * 公開ページの再生成も合わせて行うこと。
 */
export const SUPPORT_CONTACT_URL = 'https://forms.gle/EkiCqzzmxnSkT86X7';
