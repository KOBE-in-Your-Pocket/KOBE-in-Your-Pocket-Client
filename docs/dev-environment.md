# 開発環境セットアップガイド

このドキュメントは「Kobe in Your Pocket クライアントを開発するためのローカル環境を、チーム全員で同じ状態に揃える」ための完全ガイドです。

> **対象読者**: React Native / Expo を触ったことのない初学者を含む全メンバー
> **所要時間**: 初回 約2時間（Xcode・Android Studio のダウンロードが重い）

---

## TL;DR (一括セットアップ)

時間がない人向けの最短コース：

```bash
# 1. リポジトリ取得
git clone https://github.com/KOBE-in-Your-Pocket/KOBE-in-Your-Poket-Client.git
cd KOBE-in-Your-Poket-Client

# 2. Node + pnpm + 依存を一括セットアップ (Node 未インストールでも案内が出る)
bash scripts/bootstrap.sh

# 3. 環境チェック (Xcode / Android SDK の状態が一覧で見える)
bash scripts/doctor.sh

# 4. Mac で iOS 動作確認 (Xcode 必要)
pnpm ios

# 5. Android 動作確認 (Android SDK 必要)
pnpm android
```

`bootstrap.sh` は冪等なので何度実行しても安全。Node が未インストールだったり、Corepack が権限不足だったりした場合は、スクリプトが具体的な対処手順を出力します。

それでも詰まった場合は、以下の各章を順に読んでください。

---

## 0. このガイドのゴール

セットアップ完了時、以下が成立している状態：

- `pnpm start` でメトロバンドラが起動できる
- iOS Simulator（iPhone 15 / iOS 18）でアプリが立ち上がる
- Android Emulator（Pixel 8 / Android 14）でアプリが立ち上がる
- `bash scripts/doctor.sh` が全項目グリーン

---

## 1. 前提環境

### 推奨マシンスペック

| 項目           | 推奨                                     | 最低                                            |
| -------------- | ---------------------------------------- | ----------------------------------------------- |
| macOS          | macOS 14 Sonoma+（Apple Silicon M1〜M4） | macOS 13+                                       |
| Windows        | Windows 11 + WSL2（Ubuntu 22.04+）       | Windows 10 + WSL2                               |
| RAM            | 16GB                                     | 8GB（Android Emulator が重い）                  |
| ストレージ空き | 100GB                                    | 50GB（Xcode + Android Studio + AVD で大量消費） |

### サポートOS（アプリのターゲット）

| プラットフォーム | 下限                | メイン              | 最新                |
| ---------------- | ------------------- | ------------------- | ------------------- |
| iOS              | iOS 16              | iOS 18              | iOS 19              |
| Android          | Android 11 (API 30) | Android 14 (API 34) | Android 16 (API 36) |

---

## 2. 共通ツールのインストール

バージョン管理ツールは下記から **どれか1つ** 選んでください。それぞれリポジトリの設定ファイルを自動で読みます。

| ツール | 読むファイル     | おすすめ用途                                       |
| ------ | ---------------- | -------------------------------------------------- |
| `mise` | `.tool-versions` | **Node + pnpm + Java を一括** 管理したい人（推奨） |
| `asdf` | `.tool-versions` | 既に asdf 使ってる人                               |
| `nvm`  | `.nvmrc`         | Node だけ管理する人、定番ツール                    |
| `fnm`  | `.node-version`  | nvm より高速なツール                               |

### 2.1 mise（推奨）

Node / pnpm / Java をリポジトリの `.tool-versions` から自動で揃えます。

**macOS**:

```bash
brew install mise
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
source ~/.zshrc
```

**Windows (WSL)**:

```bash
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

リポジトリに `cd` してから：

```bash
mise install   # .tool-versions に書かれた Node / pnpm / Java を自動インストール
```

### 2.2 nvm

Node だけ管理。インストールは [nvm 公式](https://github.com/nvm-sh/nvm#installing-and-updating) を参照。

```bash
# nvm 導入済みの前提
cd KOBE-in-Your-Poket-Client
nvm install   # .nvmrc から 22.16.0 を読んでインストール
nvm use       # 22.16.0 に切替
```

`.nvmrc` を毎回 `nvm use` で読みに行くのが面倒なら、shell hook（[公式 README の Deeper Shell Integration](https://github.com/nvm-sh/nvm#deeper-shell-integration)）を設定すると `cd` で自動切替されます。

### 2.3 pnpm（Corepack 経由）

`mise` を使うなら不要（pnpm も同時に入る）。`nvm` や手動 Node の場合は別途：

```bash
corepack enable
corepack prepare pnpm@11.7.0 --activate
pnpm --version   # 11.7.0
```

### 2.4 リポジトリの clone と依存インストール

```bash
git clone https://github.com/KOBE-in-Your-Pocket/KOBE-in-Your-Poket-Client.git
cd KOBE-in-Your-Poket-Client
pnpm install
```

---

## 3. iOS Simulator のセットアップ（Mac のみ）

### 3.1 Xcode のインストール

App Store から **Xcode 16+** をインストール（10GB+、回線によっては1〜2時間）。
Apple ID 必須。

インストール後、一度起動して **追加コンポーネントのインストール** を完了させる：

```bash
sudo xcode-select --install
sudo xcodebuild -license accept
```

### 3.2 iOS Runtime（複数バージョン）の追加

Xcode → メニューバー **Xcode → Settings → Platforms** タブ → **+** ボタンから以下3つを順番に追加：

| Runtime      | サイズ | 用途          |
| ------------ | ------ | ------------- |
| **iOS 16.x** | 約 7GB | 下限保証      |
| **iOS 18.x** | 約 8GB | ⭐ メイン開発 |
| **iOS 19.x** | 約 8GB | 最新追従      |

> ⚠️ ダウンロードに失敗する場合は手動ダウンロード：
> https://developer.apple.com/download/all/?q=simulator
> .dmg ファイルから `xcrun simctl runtime add <path>` で追加可能。

### 3.3 Simulator デバイス作成

ターミナルで：

```bash
xcrun simctl create "iPhone SE 3 (iOS 16)" \
  "com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation" \
  "com.apple.CoreSimulator.SimRuntime.iOS-16-4"

xcrun simctl create "iPhone 15 (iOS 18)" \
  "com.apple.CoreSimulator.SimDeviceType.iPhone-15" \
  "com.apple.CoreSimulator.SimRuntime.iOS-18-0"

xcrun simctl create "iPhone 17 Pro (iOS 19)" \
  "com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro" \
  "com.apple.CoreSimulator.SimRuntime.iOS-19-0"
```

> 上記コマンドの `SimRuntime.iOS-XX-X` は実際にインストールしたRuntimeのバージョン文字列に合わせてください。確認は `xcrun simctl list runtimes`。

確認：

```bash
xcrun simctl list devices | grep -E "iPhone SE 3|iPhone 15|iPhone 17"
```

---

## 4. Android Studio / AVD のセットアップ

### 4.1 Android Studio のインストール

https://developer.android.com/studio から **Android Studio Koala (2024.1)+** をダウンロード。

**M1〜M4 Mac は必ず Apple Silicon 版を選ぶ**（Intel版を入れると x86 AVDがRosetta経由で激重）。

起動後の Setup Wizard でデフォルトの SDK Tools をインストール。

### 4.2 必要な SDK と System Image を入れる

Android Studio → **More Actions → SDK Manager** → **SDK Platforms** タブ：

- [x] Android 11 (API 30)
- [x] Android 14 (API 34)
- [x] Android 16 (API 36)

→ 各バージョンの右下「Show Package Details」をオンにして以下を選択：

| API | 必要な System Image                              |
| --- | ------------------------------------------------ |
| 30  | `Google Play ARM 64 v8a System Image` (M2 Mac用) |
| 34  | `Google Play ARM 64 v8a System Image`            |
| 36  | `Google Play ARM 64 v8a System Image`            |

> ⚠️ Mac（Apple Silicon）は **必ず `arm64-v8a` イメージ** を選ぶ。`x86_64` は Rosetta 翻訳で 5〜10倍遅い。
> Windows は `x86_64` を選ぶ。

### 4.3 環境変数の設定

`~/.zshrc` または `~/.bashrc` に追加：

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"   # macOS
# export ANDROID_HOME="$HOME/Android/Sdk"         # Linux/WSL
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

反映：

```bash
source ~/.zshrc   # or ~/.bashrc
```

### 4.4 AVD を一括作成

リポジトリの自動化スクリプトで一発：

```bash
bash scripts/setup-emulators.sh
```

これで以下の3つのAVDが作成されます：

- `Pixel_4a_API30` — Android 11、RAM 3GB（低スペック検証）
- `Pixel_8_API34` — Android 14、Play入り（メイン）
- `Pixel_9_API36` — Android 16（最新）

確認：

```bash
emulator -list-avds
```

---

## 4.5 WSL2 (Win11) ユーザー専用ガイド

> **対象**: 開発マシンが Windows 11 + WSL2 (Ubuntu 推奨) の人。Mac ユーザーは飛ばしてOK。

### 大方針

**Android Studio は Windows 側にインストールする**（WSL の中に入れない）。WSL からは Windows 側の `adb.exe` / `emulator.exe` を直接呼ぶ。これで「重い処理は Windows、コード編集は WSL」という分担になり、エミュレータも高速・安定。

```
[WSL]                              [Windows]
─────                              ────────
pnpm android                  ─→   AVD (Pixel_8_API34) を起動中
↓                                  ↓
start-android.sh                   adb.exe (Windows ネイティブ)
↓                                  ↑
ANDROID_HOME=/mnt/c/.../Sdk        ↑
↓                                  ↑
adb.exe を呼ぶ ───────────────────→ Windows の adb server
↓                                  ↓
expo start --android               Expo Go を AVD にインストール
↓                                  ↓
Metro (localhost:8081)        ←─   AVD の Expo Go が JS bundle 取りに来る
↓
Bundle 配信                   ─→   AVD 上でアプリ起動
```

### 4.5.1 Windows 側のセットアップ（一度だけ）

1. **Android Studio をインストール**（Windows 側に）
   - https://developer.android.com/studio から Windows 用をダウンロード
   - Setup Wizard で「Standard」を選んで SDK を `C:\Users\<USER>\AppData\Local\Android\Sdk` に入れる（既定）
2. **AVD Manager で `Pixel_8_API34` を作成**
   - System Image: Android 14 (API 34) Google Play、`x86_64` を選ぶ
   - （WSL 経由で動かす場合、Windows 側 emulator はネイティブ x86_64 で動く）

### 4.5.2 WSL ↔ Windows ネットワーク設定（一度だけ）

Windows の `%USERPROFILE%\.wslconfig` を作成（または編集）：

```ini
[wsl2]
networkingMode=mirrored
```

これで `localhost` が WSL と Windows で透過になり、Metro Bundler (port 8081) や adb が双方から見えるようになる。

設定反映: Windows の PowerShell で：

```powershell
wsl --shutdown
```

その後 WSL ターミナルを開き直す。

### 4.5.3 WSL 側の環境変数（一度だけ）

`~/.bashrc`（zsh なら `~/.zshrc`）に追加：

```bash
# Android SDK (Windows 側を指す)
export ANDROID_HOME="/mnt/c/Users/$USER/AppData/Local/Android/Sdk"

# Windows ネイティブの .exe を直接使う（WSL 側 adb は入れない）
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
alias adb='adb.exe'
alias emulator='emulator.exe'
```

> Windows ユーザー名と WSL ユーザー名が違う場合は `$USER` 部分を手書きで Windows 側のユーザー名に。例: `/mnt/c/Users/Taro/AppData/Local/Android/Sdk`

反映:

```bash
source ~/.bashrc   # or ~/.zshrc
```

### 4.5.4 動作確認

```bash
# Windows 側で AVD Manager から Pixel_8_API34 を起動しておく
# その後 WSL で:
cd KOBE-in-Your-Poket-Client
bash scripts/doctor.sh   # ANDROID_HOME 認識を確認
pnpm android             # adb.exe 経由で起動済 AVD を検出 → アプリ起動
```

### 4.5.5 iOS について

**WSL では iOS の動作確認は不可能**（Xcode が macOS 専用）。WSL ユーザーは：

- Android Emulator + Web で開発・動作確認
- iOS は **Mac 組のメンバーとペアで PR レビュー時に確認**

実機 iPhone で確認したい場合は Expo Go on 実機（QR読み取り）が可能。ただし PBI 1.4（地図）以降は Dev Client が必要なので、Issue #64 完了後に Mac 組からビルドを受け取る。

### 4.5.6 CRLF 改行コード問題（最頻出ハマり）

シェルスクリプトを WSL で実行した時、こんなエラーが出ることがある：

```
bash: ./scripts/bootstrap.sh: /bin/bash^M: bad interpreter: No such file or directory
```

ファイルの改行コードが CRLF（Windows形式）になっているのが原因。WSL/Linux は LF を期待する。

#### 原因

- リポジトリを `/mnt/c/...` 配下に Windows 側 Git でクローンした
- Windows 側の Git の `core.autocrlf` が `true`（既定）になっている
- VSCode などのエディタが CRLF で保存した

#### 対策（このリポジトリでは予防済み）

リポジトリ直下の `.gitattributes` でシェルスクリプト類を **LF 強制** に設定済。新規 clone なら起きない。

#### それでも CRLF になってしまった時の修復

```bash
# リポジトリ単位で改行を正規化
git config core.autocrlf input
git rm --cached -r .
git reset --hard

# または既存ファイルを直接変換
sudo apt install dos2unix          # まだなら
find scripts/ -name "*.sh" -exec dos2unix {} +

# 確認 (CRLF が無くなってればOK)
file scripts/bootstrap.sh   # 「ASCII text」ならOK、「with CRLF line terminators」だとNG
```

#### 推奨: WSL 側 (Linux ファイルシステム) で clone する

パフォーマンスも改善するので、**`~/projects/` などに clone するのを強く推奨**。`/mnt/c/...` 配下は遅いし CRLF 事故が起きやすい。

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/KOBE-in-Your-Pocket/KOBE-in-Your-Poket-Client.git
```

### 4.5.7 WSL2 のその他よくある詰まり

| 症状                                    | 対処                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `pnpm android` で `adb: device offline` | Windows 側で AVD 再起動                                                                       |
| Metro QR をスマホから読んでも繋がらない | `.wslconfig` の `networkingMode=mirrored` が効いてない。`wsl --shutdown` してターミナル再起動 |
| `pnpm install` が遅い                   | プロジェクトが `/mnt/c/` 配下にあると激遅。**Linux 側 `~/projects/` などに clone する**       |
| `bash` が `\r` / `^M` で構文エラー      | CRLF 問題。**§4.5.6 参照**                                                                    |
| `adb` コマンドが2つ衝突                 | WSL 側に apt で adb 入れてないか確認、入ってたら `sudo apt remove adb`                        |

---

## 5. 動作確認

### 5.1 doctor スクリプトで環境チェック

```bash
bash scripts/doctor.sh
```

すべての項目が `OK` になっていればセットアップ完了。

### 5.2 アプリ起動

```bash
pnpm start
```

メトロバンドラが立ち上がったら、ターミナルで：

- `i` → iOS Simulator で起動
- `a` → Android Emulator で起動
- `w` → Web ブラウザで起動

---

## 6. 推奨：エミュレータ運用ルール

| ルール                                                    | 理由                                       |
| --------------------------------------------------------- | ------------------------------------------ |
| 常時起動するのは **メイン1台のみ**（iPhone 15 + Pixel 8） | RAM 節約                                   |
| **PR レビュー時** は3バージョンで動作確認                 | リグレッション防止                         |
| 重大な機能（地図/位置/避難）は **実機でも確認**           | Emulator では検出できないバグあり          |
| Burmese 表示は **Pixel 4a API 30 で必ず確認**             | Myanmar Unicode 描画が低OSで崩れる既知問題 |
| ドイツ語表示は **iPhone 15 で確認**                       | 長文の折返し・省略の挙動                   |

---

## 7. トラブルシューティング

### Q. Android Emulator が起動しない（M2 Mac）

→ AVD に `x86_64` イメージを使っている。`arm64-v8a` で作り直し。`bash scripts/setup-emulators.sh` で正しいAVDが作られる。

### Q. iOS Simulator で「Unable to boot device」

→ Xcode → Settings → Platforms で iOS Runtime が壊れている。一度削除して再ダウンロード。

### Q. `pnpm install` が permission denied

→ `corepack enable` で `/usr/local/bin/pnpm` シンボリックリンク作成権限が無い。`sudo corepack enable` で解決。

### Q. commitlint が日本語コミットを弾く

→ プレフィックス（feat/fix/...）と `#<issue番号>` が必須。例: `feat: タブ実装 #30`

### Q. Burmese フォントが豆腐になる

→ Pixel 4a API 30 のシステムイメージに Myanmar フォントが未同梱。Android 11 の言語設定で Myanmar を追加すると引き直される。

### Q. EAS Build が必要なタイミング

→ `react-native-maps` や `expo-sqlite` のようなネイティブ依存を追加した時。Sprint 1 中盤に Dev Client を1回ビルドして全員配布する想定。

---

## 8. 参考

- spec/02_tech-stack.md — 技術スタック仕様
- spec/05_team.md — チーム構成
- spec/09_dev-environment.md — 環境仕様（バージョン定義の最上位）
- [Expo SDK 56 docs](https://docs.expo.dev/versions/v56.0.0/)
