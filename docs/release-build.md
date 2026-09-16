# リリースビルド手順（EAS）

`eas.json` は JSON でコメントを持てないため、各プロファイルの意図をここに残す。
提出までの全体計画は `docs/appstore-release-plan.md` を参照。

## ビルドプロファイル

| プロファイル          | 用途                                        | 配布                     | 版数     |
| --------------------- | ------------------------------------------- | ------------------------ | -------- |
| `development`         | Android Dev Client（APK）                   | internal                 | 手動     |
| `development-ios`     | iOS 実機 Dev Client                         | internal                 | 手動     |
| `development-ios-sim` | iOS シミュレータ Dev Client                 | internal                 | 手動     |
| `preview`             | チーム内の実機確認（TestFlight を通さない） | internal（ad hoc / APK） | 自動採番 |
| `production`          | App Store / TestFlight 提出用               | store（AAB / IPA）       | 自動採番 |

`cli.appVersionSource` は `remote`。ビルド番号は EAS 側で採番されるため、
`app.config.ts` の `version`（マーケティングバージョン）だけを手で上げる。

```bash
# チーム内配布用
npx eas-cli@latest build -p ios --profile preview

# App Store / TestFlight 用
npx eas-cli@latest build -p ios --profile production

# App Store Connect へ提出（Apple ID / ascAppId は初回に対話で聞かれる）
npx eas-cli@latest submit -p ios --profile production
```

## 環境変数

`preview` / `production` は `EXPO_PUBLIC_API_BASE_URL` を `eas.json` の `env` に持つ。
ここに置いているのは公開して問題のないバックエンドのオリジンだけで、
以下はリポジトリに入れずに EAS の環境変数（Secret）として登録する。

- `EXPO_PUBLIC_OPENROUTESERVICE_API_KEY`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_S3_IMAGE_BASE_URL`

`EXPO_PUBLIC_` 接頭辞の値は JS バンドルに焼き込まれ端末から読み取れる。
Secret 化はリポジトリからの漏洩を防ぐためであって、クライアントからの秘匿にはならない。

## ネイティブ設定の反映

`ios/` `android/` は Git 管理外（CNG）。`app.config.ts` と `assets/locales/*.json` の
変更はローカルでは `npx expo prebuild --clean`、EAS では各ビルドの prebuild で反映される。

- `assets/locales/*.json` は **ネイティブの Info.plist 文字列**（権限ダイアログ・
  ホーム画面表示名）。アプリ内文言の i18n（`src/shared/lib/i18n/locales/`）とは別物。
- Google サインインの URL スキームはネイティブに焼き込まれるため、
  クライアント ID を変えたら Dev Client を作り直すこと。
