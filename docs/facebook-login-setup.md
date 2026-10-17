# Facebook ログインの外部設定（Meta for Developers / Supabase）

Facebook ログイン（#531）のうち、コード以外の設定と申請の手順と、設定した値を記録する（#553）。
SDK の導入とネイティブ設定は #554、サインインの実装は #555、Supabase のプロバイダ設定と backend の docs は Backend #195 で行う。

> 状態: 未実施の項目は `[ ]`。設定したらチェックを付け、値（秘密情報を除く）を表に記入する。

## 1. アプリを作成する

- [ ] [Meta for Developers](https://developers.facebook.com/apps/) → **Create app**
  - Use case: **Authenticate and request data from users with Facebook Login**
  - App type（聞かれた場合）: Consumer
  - App name: `KOBE in Your Pocket`
  - App contact email: チームの共有アドレス（個人のアドレスにしない）
- [ ] App roles → 開発メンバーを **Developer**（または Tester）として追加する
  - アプリが Development モードの間は、Roles に入っている人と Test users だけがログインできる

## 2. 基本設定（App settings → Basic）

| 項目               | 設定値                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| App ID             | （取得後に記入。`.env` の `FACEBOOK_APP_ID`）                                                            |
| Display name       | `KOBE in Your Pocket`                                                                                    |
| Privacy Policy URL | `https://kobe-in-your-pocket.github.io/privacy/`                                                         |
| User data deletion | **Data deletion instructions URL**: `https://kobe-in-your-pocket.github.io/privacy/`（第 7 章。§5 参照） |
| Category           | Travel & local                                                                                           |
| App icon           | 1024×1024 のアプリアイコン                                                                               |

- Client Token: App settings → **Advanced** → Security → Client token（`.env` の `FACEBOOK_CLIENT_TOKEN`）
- App Secret はリポジトリ・`.env.example` に書かない。Supabase ダッシュボードにだけ登録する（Backend #195）

## 3. プラットフォームを登録する（App settings → Basic → Add platform）

### iOS

| 項目            | 設定値                                                       |
| --------------- | ------------------------------------------------------------ |
| Bundle ID       | `com.kobeinyourpocket.client`                                |
| iPhone Store ID | App Store Connect でアプリを作成したら記入（未作成なら空欄） |
| Single Sign On  | オフ                                                         |

- ローカル実機検証用の `com.kobeinyourpocket.client.dev`（`LOCAL_DEV_IOS=1`）は Sign in with Apple と同じく対象外にする。
  必要になったら Bundle ID を追加登録する

### Android

| 項目           | 設定値                                     |
| -------------- | ------------------------------------------ |
| Package name   | `com.kobeinyourpocket.client`              |
| Class name     | `com.kobeinyourpocket.client.MainActivity` |
| Key hashes     | 下記の 3 種類（取得したら記入）            |
| Single Sign On | オフ                                       |

Key hash は署名証明書の SHA-1 を Base64 にした値。署名ごとに必要なので、使う署名をすべて登録する。

| 署名                                         | 取得方法                                                                  | Key hash |
| -------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| ローカルの debug keystore                    | 下記コマンド                                                              |          |
| EAS の Android 署名（development / preview） | `npx eas-cli@latest credentials -p android` で SHA-1 を確認し、下記で変換 |          |
| Google Play のアプリ署名鍵（production）     | Play Console → アプリの完全性 → アプリ署名鍵の SHA-1 を下記で変換         |          |

```bash
# debug keystore から直接求める
keytool -exportcert -alias androiddebugkey -keystore android/app/debug.keystore -storepass android \
  | openssl sha1 -binary | openssl base64

# SHA-1（AA:BB:... 形式）から求める
echo '<SHA-1>' | tr -d ':' | xxd -r -p | openssl base64
```

## 4. 権限（Use cases → Facebook Login → Customize → Permissions）

- [ ] `public_profile` と `email` を追加する（それ以外は追加しない）
- この 2 つは App Review なしで一般の利用者に要求できる。審査が必要になる権限（友達リスト・写真など）は使わない
- 表示名・プロフィール画像は `public_profile` の範囲で取れるため、追加の審査は不要
- `email` は利用者が拒否できる。電話番号だけで登録したアカウントもメールが無い。
  backend は表示名を `name` → `user_metadata` → メールのローカル部 → `"user"` の順で決めるため、メールが無くても失敗しない（#555 で確認する）

## 5. データ削除の要件

Meta はログインで取得したデータの削除手段として、**Data deletion callback URL** か **Data deletion instructions URL** のどちらかを求める。

- 本アプリは **instructions URL** を使う。アカウントはアプリ内の設定画面から削除でき（#528）、
  削除すると backend が Supabase Auth のユーザーとプロフィール・レビュー等を消す
- callback は使わない。Meta から署名付きリクエストを受けて削除する API を backend に追加する必要があり、
  利用者がアプリ内で削除できる以上、二重の経路を持つ利点が小さいため
- [ ] プライバシーポリシーに Facebook ログインを追記する（§7）。instructions URL はポリシーの第 7 章（利用者の権利）を指す

## 6. 公開（Development → Live）

- [ ] テストユーザー（App roles → Test users、または Roles のメンバー）でログインできることを確認してから Live にする
- Live にする前提: §2 の Privacy Policy URL・データ削除・Category・アイコンが埋まっていること
- `public_profile` / `email` だけなら App Review の申請は不要。Meta が求める場合（Business verification や Data Use Checkup の案内）は、ダッシュボードの指示に従い、ここに記録する

## 7. ほかのリポジトリ・タスクとの整合

| 対象                                                    | 内容                                                                                                                          | 担当              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Supabase                                                | Facebook プロバイダを有効化し、App ID / App Secret を登録                                                                     | Backend #195      |
| プライバシーポリシー（`KOBE-in-Your-Pocket.github.io`） | 第 2 章・第 4 章に Facebook（と Apple）でのサインインで取得する情報・委託先を追記。重要な変更のため版数を上げ、再同意を求める | 別途              |
| App Store Connect                                       | App Privacy の「データの収集」に Facebook ログイン分を反映。SDK のトラッキング収集は #554 で止める                            | #554 / リリース前 |
| 退会（#528）                                            | アプリ内削除の導線が instructions URL の説明と一致していること                                                                | 済                |

## 8. 未解決の確認事項

- **Android で ID トークンを使えるか**: backend は `POST /api/v1/auth/facebook` で GoTrue の id_token グラントを使う。
  iOS は Limited Login で OIDC の ID トークンが得られるが、Android の Facebook SDK は ID トークンを返さない構成が既定。
  Supabase の Facebook の id_token 対応は iOS の Limited Login を想定した情報しか見当たらないため、
  Backend #195 の curl 確認で Android の扱い（`accessToken` だけで通るか、ブラウザの OAuth に切り替えるか）を決める。
  決まるまで #555 の設計（`signInWithFacebook` に渡す値）を確定しない
