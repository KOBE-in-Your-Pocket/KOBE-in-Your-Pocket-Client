# Android（Google Play）リリース手順

iOS 版（`apple/README.md`）と同じ `develop` のコードを Google Play に出すための手順。
**リードタイムの長いものから書いてある。順番どおりに進めること。**

## 前提: v1 で出す機能の範囲

`src/shared/config/feature-flags.ts` の `IS_USER_CONTENT_ENABLED` が `false` のため、
**v1 はサインイン・レビュー投稿・アカウント作成を提供しない**（#306）。これが Play 側の
作業量を大きく変える。

| 項目                          | v1 での扱い                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Google サインイン             | **使わない**。OAuth クライアント ID と、そのための SHA-1 登録は不要                                                            |
| アカウント削除用の Web ページ | **不要**。Play はアカウント作成を提供するアプリに「アプリ外（Web）からの削除要求窓口」を求めるが、作成機能が無いため該当しない |
| Google マップ                 | **使う**。API キーと SHA-1 の登録が必要（§2）                                                                                  |
| 位置情報                      | 使う。端末内で完結し、経路案内で外部地図アプリへ渡すときだけ外へ出る                                                           |
| 要求する権限                  | `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` のみ                                                                         |

サインインを解禁するとき（#556）は、OAuth クライアントの SHA-1 登録とアカウント削除の
Web 窓口が追加で必要になる。**本手順書は v1 の範囲しか書いていない。**

---

## §1 Play デベロッパーアカウント

**最長のリードタイム。ここが全体の律速。**

|                  | 個人アカウント                                    | 組織アカウント                         |
| ---------------- | ------------------------------------------------- | -------------------------------------- |
| 製品版公開の前提 | **12 人以上 × 14 日連続のクローズドテストが必須** | 不要                                   |
| 登録に必要なもの | 本人確認書類                                      | **D-U-N-S 番号**（取得に時間がかかる） |

iOS を組織の Apple Developer で取得しているなら、Play も組織登録にすればクローズドテストの
要件が外れる。ただし D-U-N-S 取得の待ち時間とのトレードオフ。**どちらが早いかは
「12 人のテスターを 14 日間確保できるか」で決まる**ので、先に判断すること。

クローズドテストをやる場合、14 日間はテスターが**実際にインストールして使い続ける**必要がある
（入れただけで放置すると条件を満たさない扱いになる報告がある）。人数と期間は余裕を持たせる。

---

## §2 Google Cloud 側（マップの API キー）

マップの API キーを「Android アプリ」で制限している場合、**呼び出し元の署名証明書の SHA-1 を
すべて登録する**必要がある。登録するのは 3 つ。

| #   | 鍵                    | 使う場面                                        | 取り方                                        |
| --- | --------------------- | ----------------------------------------------- | --------------------------------------------- |
| 1   | デバッグキーストア    | ローカルの開発ビルド                            | 下記コマンド                                  |
| 2   | EAS のアップロード鍵  | `eas build` で作った APK / AAB を直接入れたとき | `eas credentials -p android`                  |
| 3   | **Play アプリ署名鍵** | **Play から配信されたアプリ**                   | Play Console → リリース → 設定 → アプリの署名 |

```bash
# 1. デバッグキーストア
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android

# 2. EAS のアップロード鍵（対話形式。Keystore の情報に SHA-1 が出る）
eas credentials -p android
```

> [!WARNING]
> **3 番目（Play アプリ署名鍵）を忘れると、切り分けづらい不具合になる。**
> Play はアップロードした AAB を自分の鍵で**再署名**して配信するため、EAS から直接入れた
> ビルドでは動くのに、**Play 経由で入れたものだけマップが表示されない**という形で出る。
> 3 番目の SHA-1 は最初の AAB をアップロードした後でなければ Play Console に出てこないので、
> 「アップロード → SHA-1 を登録 → 配信して確認」の順になる。

API キー自体は 1 つで、3 つの SHA-1 を同じキーの「アプリの制限」に並べて登録する。

---

## §3 EAS の環境変数

`eas.json` の `build.production.env` には `EXPO_PUBLIC_API_BASE_URL` しか書いていない。
**マップの API キーは EAS の環境変数に入れる**（リポジトリに置かない）。

ローカルの `.env` はダミー値が入っていることがあるので、ローカルでマップが出ないことと
本番ビルドは別問題として切り分けること。

```bash
# 現在の登録内容を確認
eas env:list --environment production

# 登録（値を履歴に残したくないので、引数なしで対話形式にするのも可）
eas env:create --environment production \
  --name GOOGLE_MAPS_API_KEY --value "<キー>" --visibility sensitive

# preview でも地図を確認したいなら同じものを preview にも入れる
eas env:create --environment preview \
  --name GOOGLE_MAPS_API_KEY --value "<キー>" --visibility sensitive
```

EAS CLI はバージョンでフラグが変わるため、通らなければ `eas env:create --help` を見ること。

**確認方法**: ビルド後の設定に鍵が入っているかは、ローカルでは次で見える。

```bash
npx expo config --type public --json | python3 -c \
  "import json,sys; print(json.load(sys.stdin)['plugins'])" | grep -o 'androidGoogleMapsApiKey'
```

---

## §4 ビルドと提出

```bash
# AAB を作る（eas.json の production は buildType: app-bundle）
eas build --platform android --profile production

# Play へアップロード（submit.production.android.track = internal）
eas submit --platform android --profile production
```

`eas submit` には **Google Play の サービスアカウント鍵（JSON）** が必要。Play Console と
Google Cloud で発行し、初回は `eas submit` の対話で登録する。

`versionCode` は `eas.json` の `cli.appVersionSource: "remote"` + `autoIncrement: true` で
EAS が管理する。手で指定しない。現在の値は次で確認できる。

```bash
eas build:version:get -p android
```

初回アップロードは `internal`（内部テスト）に入る。そこから
内部テスト → クローズドテスト → 製品版 と上げていく。§1 のクローズドテスト要件は
**製品版に上げる前**に満たす必要がある。

---

## §5 Play Console に入力する内容

iOS 側の回答（`apple/README.md`）と食い違わないようにする。食い違うと、どちらかが
事実と違うことになる。

### データセーフティ

| 項目             | 回答                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 位置情報の収集   | **収集しない**。現在地は端末内で地図表示と距離計算に使うだけで、自社サーバーへ送らない                                               |
| 位置情報の共有   | **共有しない**。経路案内は利用者の操作で外部地図アプリへ座標を渡すが、これは利用者が起点の受け渡しであって当アプリによる送信ではない |
| 個人情報の収集   | **収集しない**（v1 はアカウント作成が無い）                                                                                          |
| データの暗号化   | 通信は HTTPS                                                                                                                         |
| データ削除の要求 | 該当なし（収集していない）                                                                                                           |

### コンテンツのレーティング（IARC）

- ユーザー生成コンテンツ **なし**（`IS_USER_CONTENT_ENABLED = false`）
- 暴力・性的表現・ギャンブル・薬物の表現 なし
- 広告 なし

### 対象ユーザーと内容

- 対象年齢: **18 歳以上**（iOS と揃える）。ファミリー向けポリシーの対象外になる
- 子ども向けの訴求はしない

### アプリのアクセス権

- **全機能が制限なく利用可能**（ログイン不要）。審査用のテストアカウントは不要

### その他

- プライバシーポリシー URL: https://kobe-in-your-pocket.github.io/
- 広告: なし
- アプリ内購入: なし

---

## 付記: リポジトリ側で済んでいること

- `android.package` = `com.kobeinyourpocket.client`（iOS のバンドル ID と同じ）
- アダプティブアイコン（前景 / 背景 / モノクロ）を設定済み
- `eas.json` の `production` が `buildType: app-bundle`（Play は AAB 必須）
- `submit.production.android.track` = `internal`
- **不要な権限を外した**（`android.blockedPermissions`）。Expo の既定マニフェストは
  「OPTIONAL PERMISSIONS, REMOVE WHATEVER YOU DO NOT NEED」として
  `SYSTEM_ALERT_WINDOW` / `VIBRATE` / `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` を
  入れてくる。どれも使っておらず、Play の掲載ページには宣言した権限がそのまま並ぶため外した
  - 副作用: Android の dev client で開発メニューのフローティングバブルが出なくなる。
    端末を振る、または `adb shell input keyevent 82` で開ける
- `targetSdkVersion` は Expo SDK 56 が管理する。Play の target API レベル要件を満たさない場合は
  アップロード時にエラーで分かる
