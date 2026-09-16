# KOBE in Your Poket (Client)

神戸市特化、外国人観光客向け観光・避難・マナー一体化アプリのクライアント (Expo + React Native) リポジトリです。

---

## Quick Start (新メンバー向け一括セットアップ)

```bash
git clone https://github.com/KOBE-in-Your-Pocket/KOBE-in-Your-Poket-Client.git
cd KOBE-in-Your-Poket-Client
bash scripts/bootstrap.sh    # Node/pnpm 確認 → 依存インストール まで一括
pnpm ios                      # iPhone 15 を自動起動 (Mac の場合)
# または
pnpm android                  # Pixel_8_API34 を自動起動
```

`bootstrap.sh` で詰まったら（Corepack 権限エラーなど）スクリプトが対処手順を出します。
詳細セットアップは [`docs/dev-environment.md`](./docs/dev-environment.md) を参照。

> **WSL2 (Win11) ユーザー**: Android Studio は **Windows 側** にインストール、WSL からは `adb.exe` 経由で動かす方式です。専用手順を [`docs/dev-environment.md §4.5`](./docs/dev-environment.md#45-wsl2-win11-ユーザー専用ガイド) にまとめています。

---

## 前提環境 (Prerequisites)

このプロジェクトを動かすには、以下が必要です。

- **OS**: macOS、または Windows (WSL2 必須 — Windows ネイティブシェルでは動作確認していません)
- **Node.js**: `22.16.0` (リポジトリ直下の `.node-version` / `.tool-versions` / `.nvmrc` で固定)
  - バージョン管理ツールは `mise` / `asdf` / `nvm` のいずれかを使ってください。
  - `mise` / `asdf` を使う場合: `.tool-versions` を読み取り、`mise install` で Node / pnpm / Java を一括導入。
  - `nvm` を使う場合: `.nvmrc` を読み取る。リポジトリで `nvm install` → `nvm use` で 22.16.0 に切替。
  - その他のツール (`fnm` 等) も `.node-version` を自動で読み取れます。
- **Corepack**: Node 22 に同梱されています。後述の手順で有効化します。
- **iOS Simulator**: Xcode 16+ (macOS のみ、iOS で動作確認する場合)
- **Android Emulator**: Android Studio Koala 2024.1+ (任意)

> **🎯 iOS / Android のエミュレータバージョンや AVD の作り方は [`docs/dev-environment.md`](./docs/dev-environment.md) に集約しています。チーム全員でバージョンを揃えるため、必ず一読してください。**

> パッケージマネージャは **pnpm 11.7.0** を `package.json` の `packageManager` フィールドで固定しています。`npm install` や `yarn install` は使わないでください。

---

## セットアップ手順 (初回)

pnpm や Expo を触ったことがない方向けに、丁寧めに書いています。コピペで進められます。

### 1. リポジトリをクローン

```bash
git clone <このリポジトリのURL>
```

### 2. プロジェクトディレクトリに移動

```bash
cd KOBE-in-Your-Poket-Client
```

### 3. Corepack を有効化

```bash
corepack enable
```

Corepack は Node に同梱されているツールで、`package.json` の `packageManager` フィールドを読み取り、**プロジェクトごとに正しいバージョンの pnpm を自動で使ってくれる**仕組みです。これを有効化することで、チーム全員が同じ pnpm バージョンを使えるようになります。

> macOS で `EACCES` 系の権限エラーが出る場合は、下の「トラブルシューティング」を参照してください。

### 4. 依存パッケージをインストール

```bash
pnpm install
```

初回は数分かかります。`pnpm-lock.yaml` に固定されているバージョンのまま入ります。

### 5. 開発サーバを起動

```bash
pnpm start
```

Expo の開発サーバ (Metro) が立ち上がり、ターミナルにメニューが出ます。以下のキーを押して動作確認します。

- `i` … iOS シミュレータで起動 (macOS + Xcode 必須)
- `a` … Android エミュレータで起動 (Android Studio 必須)
- `w` … Web ブラウザで起動

> 実機で確認したい場合は、App Store / Google Play から **Expo Go** をインストールして、ターミナルに表示される QR コードを読み取ってください。

---

## npm スクリプト一覧

`pnpm <スクリプト名>` で実行できます。

| スクリプト     | 用途                                     |
| -------------- | ---------------------------------------- |
| `start`        | Expo 開発サーバ起動 (Metro)              |
| `ios`          | iOS シミュレータで起動                   |
| `android`      | Android エミュレータで起動               |
| `web`          | Web ブラウザで起動                       |
| `lint`         | ESLint で静的解析                        |
| `typecheck`    | TypeScript の型チェック (`tsc --noEmit`) |
| `format`       | Prettier で全ファイルを整形              |
| `format:check` | Prettier の差分チェック (CI で使用)      |
| `test`         | Jest でテスト実行                        |

---

## ブランチ戦略・コミット規約

開発ルールの詳細は仕様リポジトリ (`docs/spec/04_dev-rules.md`) を参照してください。要点は以下の通りです。

### ブランチ

| ブランチ    | 用途                                                    |
| ----------- | ------------------------------------------------------- |
| `main`      | リリース用。**直接 push 禁止**                          |
| `develop`   | 開発統合用。**直接 push 禁止**。PR はこちらに向けて出す |
| `feat/#xxx` | 機能追加用。`xxx` は GitHub Issue 番号                  |
| `fix/#xxx`  | バグ修正用。`xxx` は GitHub Issue 番号                  |

- `main` および `develop` への直接 push は禁止です。
- Pull Request は **必ず `develop` に向けて** 作成してください。

### コミットメッセージ

フォーマットは以下に固定されており、commitlint で自動検証されます。

```
<prefix>: <summary> #<issue-number>
```

例: `feat: 観光スポット一覧画面を追加 #12`

使用できる prefix:

- `feat` … 新機能
- `fix` … バグ修正
- `docs` … ドキュメントのみの変更
- `style` … コード整形 (動作に影響しないもの)
- `refactor` … リファクタ
- `test` … テスト追加・修正
- `chore` … ビルド設定や雑務

---

## 技術スタック

| 領域                 | 採用技術                                              |
| -------------------- | ----------------------------------------------------- |
| フレームワーク       | Expo SDK 56 / React Native                            |
| ルーティング         | Expo Router (ファイルベース)                          |
| 言語                 | TypeScript (strict)                                   |
| パッケージマネージャ | pnpm 11.7.0 (Corepack 経由)                           |
| Lint                 | ESLint                                                |
| Formatter            | Prettier                                              |
| Git フック           | Husky + lint-staged                                   |
| コミット検証         | commitlint (`@commitlint/config-conventional` ベース) |
| テスト               | Jest + jest-expo + @testing-library/react-native      |

---

## プロジェクト構成

```
KOBE-in-Your-Poket-Client/
├── src/
│   ├── app/             # Expo Router のファイルベースルーティング (画面はここ)
│   └── __tests__/       # Jest のテストコード
├── assets/              # 画像・フォントなど静的アセット
├── .github/workflows/   # GitHub Actions (Lint / Test)
└── package.json
```

---

## 開発環境のチェック・自動化スクリプト

| スクリプト                        | 用途                                                       |
| --------------------------------- | ---------------------------------------------------------- |
| `bash scripts/bootstrap.sh`       | **新メンバー向け一括セットアップ** (Node/pnpm/依存) - 冪等 |
| `bash scripts/doctor.sh`          | 環境チェック（Node / pnpm / Xcode / iOS Runtime / AVD 等） |
| `bash scripts/setup-emulators.sh` | 標準 Android AVD (Pixel 4a/8/9) を一括作成                 |

詳細は [`docs/dev-environment.md`](./docs/dev-environment.md) を参照。

---

## アプリ起動 (iOS / Android / Web)

### pnpm スクリプト

| コマンド           | 動作                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `pnpm start`       | Metro Bundler のみ起動。`i` / `a` / `w` で切替                       |
| `pnpm ios`         | **iPhone 15 (iOS 18) を自動起動** → Metro + Expo 起動                |
| `pnpm android`     | **Pixel_8_API34 (Android 14) を自動起動** → boot完了待ち → Expo 起動 |
| `pnpm web`         | Metro + ブラウザで起動 (http://localhost:8081)                       |
| `pnpm ios:raw`     | `expo start --ios` を素で呼ぶ（機種指定なし、デフォルト動作）        |
| `pnpm android:raw` | `expo start --android` を素で呼ぶ（機種指定なし、デフォルト動作）    |

> **`pnpm ios` / `pnpm android` は `scripts/start-ios.sh` / `start-android.sh` を呼ぶラッパー**です。
> チーム共通のメイン機種を自動 boot するので、誰がやっても同じ機種で動作確認できます。
> 別バージョンを試したいときは下記の手動手順、または `pnpm ios:raw` / `pnpm android:raw`。

### 別バージョンで動作確認したいとき (PRレビュー時など)

#### iOS

```bash
# 下限保証 (PRレビュー時の追加確認)
xcrun simctl boot "iPhone SE (3rd generation)"
open -a Simulator
pnpm ios:raw

# 最新追従 (PRレビュー時の追加確認)
xcrun simctl boot "iPhone 16 Pro"
open -a Simulator
pnpm ios:raw
```

利用可能な Simulator 一覧:

```bash
xcrun simctl list devices available
```

#### Android

```bash
emulator -avd Pixel_4a_API30 &    # 下限保証 (低スペック検証)
emulator -avd Pixel_9_API36 &     # 最新追従

# 起動完了後
pnpm android:raw
```

### 停止のしかた

| 対象             | 停止コマンド                           |
| ---------------- | -------------------------------------- |
| Metro Bundler    | ターミナルで `Ctrl + C`                |
| iOS Simulator    | `xcrun simctl shutdown all` または ⌘+Q |
| Android Emulator | `adb -s emulator-5554 emu kill`        |

---

## トラブルシューティング

### `pnpm install` で macOS の権限エラー (`EACCES` on `/usr/local/bin/pnpm`)

`corepack enable` 実行時に `/usr/local/bin/pnpm` などへのシンボリックリンク作成で権限が足りずに失敗するケースがあります。Homebrew の Node を使っている場合に起きやすい現象です。

対処方法:

```bash
sudo corepack enable
```

詳しくは Corepack の公式ドキュメント (パーミッション関連) を参照してください。`nvm` / `mise` / `asdf` で Node をインストールし直すと、ユーザ領域に入るため起きにくくなります。

### コミットが commitlint に弾かれる

エラーメッセージに `subject may not be empty` や `type may not be empty` と出る場合、コミットメッセージのフォーマットが規約から外れています。以下を守ってください。

```
prefix: summary #123
```

- `prefix` は `feat / fix / docs / style / refactor / test / chore` のいずれか
- `:` の後ろに半角スペースが必要
- 末尾に `#<Issue番号>` を付ける

### Windows ユーザ向け

Windows ネイティブの PowerShell / cmd では動作確認していません。**必ず WSL2 (Ubuntu 推奨)** 上で開発してください。WSL 内で Node / Corepack / pnpm をセットアップしてから上記手順に進んでください。

---

## ライセンス

`LICENSE` ファイルを参照してください。
