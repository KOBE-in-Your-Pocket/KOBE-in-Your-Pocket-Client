# WSL2 セットアップガイド（初心者向け）

Windows 11 + WSL2 環境で Android エミュレータ上にアプリを起動するまでの手順書です。
「コマンドを打ったことがほぼない」人でも進められるよう、一つひとつ説明します。

**所要時間**: 約 2〜3 時間（Android Studio のダウンロードが重いため）

---

## この手順書でやること

```
あなたのPC
├── Windows 側
│   └── Android Studio（エミュレータを動かすアプリ）
│
└── WSL2（Ubuntu）側
    └── コード編集・ビルド・pnpm android コマンドを叩く場所
```

WSL 側でコマンドを叩くと → Windows のエミュレータにアプリが表示される、という仕組みです。

---

## 準備：WSL ターミナルの開き方

1. Windows キーを押して「Ubuntu」と検索
2. Ubuntu アプリを起動
3. 黒い画面（ターミナル）が開いたら準備OK

この手順書に出てくるコマンドはすべてこのターミナルに貼り付けて Enter を押します。

---

## Step 1: プロジェクトへ移動する

```bash
cd ~/KOBE-in-Your-Poket-Client
```

> **`cd` とは？** フォルダを移動するコマンドです。
> `~` はホームフォルダ（Windowsの「ドキュメント」のような場所）を指します。

移動できたか確認：

```bash
pwd
```

`/home/hibiki/KOBE-in-Your-Poket-Client` と表示されれば OK。

---

## Step 2: mise をインストールする

> **mise とは？** Node.js や pnpm などのバージョンを自動で揃えてくれるツールです。
> 「.tool-versions というファイルに書かれたバージョンを自動でインストールしてくれる」と覚えてください。

```bash
curl https://mise.run | sh
```

インストールが終わったら、mise を毎回自動で使えるように設定します：

```bash
echo 'eval "$(/home/hibiki/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
```

> **`~/.bashrc` とは？** ターミナルを開くたびに自動で実行される設定ファイルです。
> ここに mise の起動コマンドを追加することで、次回以降は自動で使えるようになります。

確認：

```bash
mise --version
```

バージョン番号が表示されれば OK。

---

## Step 3: Node.js / pnpm / Java を一括インストールする

プロジェクトフォルダに `.tool-versions` というファイルがあり、必要なバージョンが書かれています。
mise がそれを読んで自動でインストールしてくれます。

```bash
mise install
```

しばらく待つとインストールが完了します（初回は数分かかります）。

インストール後、シムを更新します（pnpm が見つからない場合の対策）：

```bash
~/.local/bin/mise reshim
```

確認：

```bash
node --version   # v22.16.0 と表示されればOK
pnpm --version   # 11.7.0 と表示されればOK
java -version    # openjdk 21... と表示されればOK
```

---

## Step 4: プロジェクトの依存パッケージをインストールする

> **依存パッケージとは？** アプリを動かすために必要な外部ライブラリのことです。
> `pnpm install` を実行すると、`package.json` に書かれたものを自動でダウンロードします。

```bash
pnpm install
```

`Done in XX.Xs` と表示されれば完了です。

---

## Step 5: Windows に Android Studio をインストールする

ここからは **WSL ではなく Windows 側の作業**です。
WSL のターミナルは閉じずに残しておいてください。

### 5-1. Android Studio をダウンロード

Windows のブラウザで次のページを開いてください：

```
https://developer.android.com/studio
```

「Download Android Studio」をクリックして、インストーラー（.exe ファイル）を実行します。

### 5-2. インストールウィザードの設定

- 「Install Type」が聞かれたら **Standard** を選ぶ
- SDK のインストール先を **`C:\Android\Sdk`** に変更する
  （既定値 `C:\Users\hitoy\AppData\Local\Android\Sdk` だと WSL からアクセスできないため）
- あとはデフォルトのまま「Next」を押し続ける

### 5-3. Command-line Tools を追加インストール

Android Studio が開いたら：

1. **More Actions → SDK Manager** をクリック
2. **SDK Tools** タブを開く
3. **Android SDK Command-line Tools (latest)** にチェックを入れる
4. **OK** をクリック → インストールを待つ

### 5-4. エミュレータ（仮想 Android 端末）を作成する

1. **More Actions → Virtual Device Manager** をクリック
2. **Create Device** ボタンをクリック
3. 以下の設定で作成する：
   - Hardware: **Pixel 8**
   - System Image: **API 34 / Android 14 / Google Play / x86_64**
   - AVD Name: **Pixel_8_API34**（名前は変えないこと）
4. **Finish** をクリック

---

## Step 6: WSL ↔ Windows のネットワーク設定

WSL と Windows が `localhost` で通信できるように設定します。

### 6-1. .wslconfig ファイルを作成

Windows の **PowerShell**（スタートメニューで「PowerShell」と検索）を開いて：

```powershell
notepad $env:USERPROFILE\.wslconfig
```

メモ帳が開くので、以下を貼り付けて保存（Ctrl+S）：

```ini
[wsl2]
networkingMode=mirrored
```

### 6-2. WSL を再起動して設定を反映

PowerShell で：

```powershell
wsl --shutdown
```

その後、Ubuntu を開き直す。

---

## Step 7: ANDROID_HOME を設定する

> **ANDROID_HOME とは？** 「Android SDK がどこにあるか」を WSL に教える環境変数です。
> これを設定しないと、コマンドが SDK の場所を見つけられません。

WSL ターミナルで：

```bash
cat >> ~/.bashrc << 'EOF'

# Android SDK の場所を指定
export ANDROID_HOME="/mnt/c/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
alias adb='adb.exe'
alias emulator='emulator.exe'
EOF
source ~/.bashrc
```

> **なぜ `/mnt/c/Android/Sdk`？**
> WSL から Windows の `C:\` ドライブを見るときは `/mnt/c/` という形で見えます。
> `C:\Android\Sdk` → `/mnt/c/Android/Sdk` と読み替えてください。

---

## Step 8: adb ラッパーを作成する

> **この作業が必要な理由**: Expo（アプリを起動するツール）は `adb` というコマンドをフルパスで呼びます。
> しかし Windows 側の SDK には `adb.exe` しかなく、WSL は `adb` という名前のファイルを見つけられません。
> そこで、`adb` という名前で `adb.exe` を呼ぶ「橋渡しスクリプト」を作ります。

```bash
printf '#!/bin/sh\nexec "$(dirname "$0")/adb.exe" "$@"\n' > /mnt/c/Android/Sdk/platform-tools/adb
chmod +x /mnt/c/Android/Sdk/platform-tools/adb
```

コマンドラインで使う `adb` / `emulator` コマンドのためのリンクも作成：

```bash
sudo ln -sf /mnt/c/Android/Sdk/emulator/emulator.exe /usr/local/bin/emulator
sudo ln -sf /mnt/c/Android/Sdk/platform-tools/adb.exe /usr/local/bin/adb
```

> `sudo` を使うとパスワードを求められます。WSL のパスワード（インストール時に設定したもの）を入力してください。

---

## Step 9: デバッガー用ライブラリをインストール

```bash
sudo apt-get install -y libnspr4
```

---

## Step 10: 環境チェック

すべての設定が正しいか確認します：

```bash
bash scripts/doctor.sh
```

以下のように **すべて ✓** になれば完了です：

```
✓ WSL2 (Win11 想定)
✓ node 22.16.0
✓ pnpm 11.7.0
✓ Java バージョン OK（17 or 21）
✓ ANDROID_HOME=/mnt/c/Android/Sdk
✓ adb.exe 確認
✓ AVD 'Pixel_8_API34' あり
✓ node_modules あり
✓ packageManager フィールド = pnpm@11.7.0
```

---

## Step 11: アプリを起動する

1. **Windows 側**で Android Studio を開く
2. **Virtual Device Manager** → Pixel_8_API34 の **▶ ボタン** を押してエミュレータを起動
3. エミュレータが完全に起動するまで待つ（ロック画面が出ればOK）
4. **WSL ターミナル**で：

```bash
cd ~/KOBE-in-Your-Poket-Client
pnpm android
```

エミュレータにアプリが表示されれば成功です！

---

## よくあるエラーと対処法

### `pnpm: command not found`

```bash
~/.local/bin/mise reshim
source ~/.bashrc
```

### `ERROR: AVD 'Pixel_8_API34' が見つかりません`（でも直下に名前が表示される）

Windows 改行コードの問題。`scripts/start-android.sh` が修正済みであれば起きないはずです。
起きた場合は開発リーダーに連絡。

### `spawn .../adb ENOENT`

Step 8 の adb ラッパー作成が完了しているか確認：

```bash
ls /mnt/c/Android/Sdk/platform-tools/adb
```

ファイルがなければ Step 8 を再実行。

### `Permission denied` で SDK フォルダにアクセスできない

SDK が `C:\Users\hitoy\AppData\...` にインストールされている。
Android Studio の SDK Manager でパスを `C:\Android\Sdk` に変更する。

### `adb: device offline`

Windows 側のエミュレータを再起動する。

### `pnpm install` がとても遅い

プロジェクトが `/mnt/c/` 配下にある場合、Windows ファイルシステムの影響で遅くなります。
`~/KOBE-in-Your-Poket-Client`（Linux ファイルシステム側）に clone し直してください。

---

## 毎日の開発の流れ

2回目以降は Step 1〜9 は不要です。以下だけで始められます：

```bash
# 1. Windows 側でエミュレータを起動（Android Studio → Virtual Device Manager → ▶）

# 2. WSL でアプリを起動
cd ~/KOBE-in-Your-Poket-Client
pnpm android
```

---

## 参考

- `docs/dev-environment.md` — より詳しい環境設定ガイド（上級者向け）
- `docs/wsl-setup-session-log.md` — このセットアップで実際にやったことの技術的記録
