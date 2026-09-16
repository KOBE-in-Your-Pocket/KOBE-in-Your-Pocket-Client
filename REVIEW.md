# AI / 人間共通 PR レビュー基準

このファイルは PR レビュー（[CodeRabbit](https://github.com/apps/coderabbitai) 一次レビュー・人間レビュー共通）の判断基準です。
詳細なアーキテクチャは `docs/directory-structure.md` を参照してください。

## プロジェクト概要

- 神戸市特化の観光・避難・マナー一体化アプリ（Expo SDK 56 / React Native）
- TypeScript strict、pnpm、Expo Router
- PR は `develop` 向け。コミットは `prefix: summary #issue` 形式

## アーキテクチャ（最重要）

- **Modular Monolith × Feature-scoped Clean Architecture** を守る
- 配置先の判断:
  - ルーティングのみ → `src/app/`
  - 機能単位 → `src/features/{context}/`
  - 複数機能の合成 → `src/widgets/`
  - 共通基盤 → `src/shared/`
- **モジュール間は `index.ts` 経由のみ import**（内部ファイルの直接 import は禁止）
- 層の依存方向: `ui → application → domain ← infrastructure`

## コード品質

- Expo SDK 56 の推奨パターンに従う（`AGENTS.md` 参照）
- ユーザー向け文言は i18n 経由（`src/shared/lib/i18n/`）
- 位置情報・地図利用時は権限ハンドリングとエラー状態を確認
- React Query のキャッシュ・エラーハンドリングが適切か
- 不要な `any`、未使用コード、デバッグログが残っていないか

## テスト

- ビジネスロジック・ユーティリティにはユニットテストを追加
- UI 変更は `@testing-library/react-native` で主要パスをカバー
- エッジケース（オフライン、権限拒否、空データ）を考慮

## セキュリティ・プライバシー

- API キー・認証情報のハードコード禁止
- 位置情報などセンシティブデータのログ出力禁止
- 外部 URL やディープリンクの検証

## CI で既に担保されている項目（レビュー不要）

- ESLint (`pnpm lint`)
- TypeScript 型チェック (`pnpm typecheck`)
- Prettier (`pnpm format:check`)
- Jest (`pnpm test`)

これらは指摘せず、設計・ロジック・仕様妥当性に集中すること。
