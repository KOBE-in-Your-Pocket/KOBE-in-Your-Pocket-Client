# WSL2 セットアップ作業ログ（2026-06-18）

Windows 11 + WSL2 (Ubuntu) 環境で `pnpm android` を動かすまでの作業記録。

---

## 作業前の状態

| 項目           | 状態             |
| -------------- | ---------------- |
| WSL2           | ✅ 確認済み      |
| Node.js        | v20.11.0（古い） |
| pnpm           | 未導入           |
| ANDROID_HOME   | 未設定           |
| Android Studio | 未インストール   |

---

## 作業内容

### 1. mise のインストール（Node / pnpm / Java バージョン管理）

```bash
curl https://mise.run | sh
echo 'eval "$(/home/hibiki/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

**ハマりポイント**: 初回 `mise install` 後、pnpm のシムが生成されなかった。

```bash
~/.local/bin/mise reshim   # シム再生成で解決
```

### 2. .tool-versions から一括インストール

```bash
cd ~/KOBE-in-Your-Poket-Client
mise install   # Node 22.16.0 / pnpm 11.7.0 / Java corretto-21.0.4.7.1 を一括取得
```

### 3. 依存インストール

```bash
pnpm install
```

### 4. Windows 側 Android Studio のインストール

- SDK パスを **`C:\Android\Sdk`**（既定の AppData 配下ではなく）に変更
  - 理由: WSL から `C:\Users\hitoy\AppData\` へのアクセスが NTFS 権限で拒否されるため
- SDK Manager から **Android SDK Command-line Tools (latest)** を追加インストール
- Virtual Device Manager で **Pixel_8_API34**（API 34 / Google Play / x86_64）を作成

### 5. ANDROID_HOME を ~/.bashrc に追記

```bash
export ANDROID_HOME="/mnt/c/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
alias adb='adb.exe'
alias emulator='emulator.exe'
```

> **注意**: Windows ユーザー名 (`hitoy`) と WSL ユーザー名 (`hibiki`) が異なるため、
> `$USER` ではなく固定パスを使用。

### 6. adb ラッパースクリプトの作成

Node.js（Expo）は `$ANDROID_HOME/platform-tools/adb` をフルパスで直接 spawn する。
WSL では `adb.exe` しか存在しないため、ラッパーを作成：

```bash
printf '#!/bin/sh\nexec "$(dirname "$0")/adb.exe" "$@"\n' > /mnt/c/Android/Sdk/platform-tools/adb
chmod +x /mnt/c/Android/Sdk/platform-tools/adb
```

> エイリアス (`alias adb='adb.exe'`) はシェル内でしか効かず、スクリプト・Node.js からは無効。

### 7. /usr/local/bin へのシンボリックリンク

シェルスクリプト内から `emulator` / `adb` コマンドとして呼べるように：

```bash
sudo ln -sf /mnt/c/Android/Sdk/emulator/emulator.exe /usr/local/bin/emulator
sudo ln -sf /mnt/c/Android/Sdk/platform-tools/adb.exe /usr/local/bin/adb
```

### 8. scripts/start-android.sh の修正

`emulator.exe` の出力には Windows 改行コード `\r` が含まれ、`grep -x`（完全一致）が失敗していた。

```bash
# 修正箇所1: AVD 存在確認
emulator -list-avds 2>/dev/null | tr -d '\r' | grep -qx "${TARGET_AVD}"

# 修正箇所2: adb devices の判定
adb devices 2>/dev/null | tr -d '\r' | awk 'NR>1 && $2=="device"' | grep -q '^emulator-'
```

### 9. scripts/doctor.sh の修正

WSL + Windows SDK 環境では `sdkmanager` / `avdmanager`（Linux バイナリ）が存在しない。
WSL 判定を追加し、`adb.exe` の存在確認と `avdmanager.bat` 経由の AVD 一覧表示に切り替え。

### 10. libnspr4 のインストール（React Native DevTools 用）

```bash
sudo apt-get install -y libnspr4
```

---

## 作業後の状態

| 項目                     | 状態                   |
| ------------------------ | ---------------------- |
| Node.js                  | ✅ 22.16.0             |
| pnpm                     | ✅ 11.7.0              |
| Java                     | ✅ corretto-21.0.4.7.1 |
| ANDROID_HOME             | ✅ /mnt/c/Android/Sdk  |
| AVD Pixel_8_API34        | ✅                     |
| `bash scripts/doctor.sh` | ✅ 全項目グリーン      |

---

## 起動手順（毎回）

1. Windows 側で Android Studio → Virtual Device Manager → **Pixel_8_API34** を ▶ 起動
2. WSL ターミナルで：

```bash
cd ~/KOBE-in-Your-Poket-Client
pnpm android
```

---

## 主なハマりポイントまとめ

| 症状                                                       | 原因                                               | 対処                               |
| ---------------------------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| `pnpm: command not found`                                  | mise のシムが未生成                                | `mise reshim`                      |
| `/mnt/c/Users/hitoy/` Permission denied                    | WSL ユーザーと Windows ユーザーが異なる            | SDK を `C:\Android\Sdk` に移動     |
| `sdkmanager が見つかりません`                              | Windows SDK には `.bat` しかない                   | doctor.sh を WSL 対応に修正        |
| `AVD 'Pixel_8_API34' が見つかりません`（AVD は表示される） | `emulator.exe` 出力の CRLF で grep 失敗            | `tr -d '\r'` を挟む                |
| `spawn .../adb ENOENT`                                     | Node.js が `adb.exe` でなく `adb` をフルパスで呼ぶ | ラッパースクリプトを作成           |
| React Native DevTools エラー                               | `libnspr4.so` 未インストール                       | `sudo apt-get install -y libnspr4` |
