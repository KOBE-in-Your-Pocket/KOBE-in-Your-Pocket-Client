// CSS はネイティブ/テスト環境では意味を持たないため、jest では空モジュールへ差し替える。
// これにより `@/global.css` を読み込む theme.ts を含むモジュール（例: features の
// 公開 API バレル）を、テストからそのまま import できる。
module.exports = {};
