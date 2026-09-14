/**
 * 利用者からの問い合わせ窓口 URL。
 *
 * App Store Guideline 1.2 は、UGC を扱うアプリに開発者への連絡手段の提供を求める。
 * v1 は UGC を出さないため必須ではないが、プライバシーポリシー第 7 章の請求窓口として
 * 到達手段を 1 つは公開しておく必要がある。
 *
 * 現時点ではチーム共用のメールアドレスが無いため、GitHub Issues を窓口とする
 * （チーム決定・2026-09-14）。メールアドレスを用意したらここを差し替え、
 * Specification の `docs/legal/privacy-policy.*.md` 第 1 章も合わせて更新すること。
 */
export const SUPPORT_CONTACT_URL =
  'https://github.com/KOBE-in-Your-Pocket/KOBE-in-Your-Poket-Client/issues';
