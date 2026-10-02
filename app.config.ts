import type { ExpoConfig } from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

// ── Google サインイン（iOS）─────────────────────────────────
// クライアント ID は「<id>.apps.googleusercontent.com」形式。ネイティブ側の
// URL スキームはその逆順表記（com.googleusercontent.apps.<id>）なので、ここで導出する。
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const googleIosUrlScheme = googleIosClientId
  ? `com.googleusercontent.apps.${googleIosClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`
  : undefined;

// ── ローカル実機検証用の署名オーバーライド ─────────────────────
// 本番 bundle id (com.kobeinyourpocket.client) は組織の Apple Developer
// アカウントが所有しているため、無料の個人チームでは同一 id を登録できない。
// LOCAL_DEV_IOS=1 のときだけ dev 用 id + 個人チームに切り替える。
// この分岐は EAS / App Store 向けビルド（LOCAL_DEV_IOS 未設定）には一切影響しない。
const isLocalDevIos = process.env.LOCAL_DEV_IOS === '1';
const iosBundleIdentifier = isLocalDevIos
  ? 'com.kobeinyourpocket.client.dev'
  : 'com.kobeinyourpocket.client';
const iosAppleTeamId = isLocalDevIos ? process.env.IOS_DEV_TEAM_ID : undefined;

// 開発用 backend が HTTP のときだけ ATS 例外を焼き込む（シミュレータ / EAS Dev Client 向け）。
// デプロイ環境の backend は HTTPS 化済み（https://18-181-34-28.sslip.io）のため例外は不要で、
// この分岐はローカル HTTP backend を使う開発ビルドだけに効く。
// 本番 iOS ビルド（production / preview プロファイル）では例外を入れない。
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const usesHttpBackend = apiBaseUrl?.startsWith('http://') ?? false;
const isProductionIosBuild =
  process.env.EAS_BUILD_PROFILE === 'production' || process.env.EAS_BUILD_PROFILE === 'preview';
const needsInsecureHttpExceptions = !isProductionIosBuild && (isLocalDevIos || usesHttpBackend);

if (!googleIosClientId) {
  console.warn(
    '[app.config] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID が未設定です。\n' +
      '  Google サインインの URL スキームがネイティブビルドに焼き込まれず、サインインは動作しません。\n' +
      '  ネイティブビルド（dev client 再作成）前に .env に設定してください（.env.example 参照）。',
  );
}

if (!googleMapsApiKey) {
  console.warn(
    '[app.config] GOOGLE_MAPS_API_KEY が未設定です。\n' +
      '  この値はネイティブビルド時（EAS build / expo run:android）に AndroidManifest へ焼き込まれます。\n' +
      '  EAS 配布 APK を Dev Client として使っている場合はビルド済みのキーが入っているため、この警告は無視できます。\n' +
      '  ローカルでネイティブを作り直す場合のみ .env に設定してください（.env.example 参照）。',
  );
}

export default (): ExpoConfig => ({
  // ホーム画面・App Store に出る製品名。slug と EAS プロジェクトの紐付けは
  // 'KOBE-in-Your-Poket-Client' のままにする（変更すると EAS の参照が切れるため）。
  name: 'KOBE in Your Pocket',
  slug: 'KOBE-in-Your-Poket-Client',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/app-icon.png',
  scheme: 'kobeinyourpoketclient',
  userInterfaceStyle: 'automatic',
  ios: {
    // ここに Expo テンプレート既定の `./assets/expo.icon`（Icon Composer バンドル）を
    // 指定していたため、ビルド 2 のアイコンが Expo ロゴになっていた。上の `icon`
    // （./assets/images/app-icon.png）を使わせるため、iOS 側の指定は外す。
    bundleIdentifier: iosBundleIdentifier,
    ...(iosAppleTeamId ? { appleTeamId: iosAppleTeamId } : {}),
    infoPlist: {
      // 非適用暗号（HTTPS 以外の独自暗号）を含まないことの申告。
      // 未設定だと提出のたびに App Store Connect で輸出コンプライアンスを聞かれる。
      ITSAppUsesNonExemptEncryption: false,
      // 権限ダイアログを端末の言語で出すために必要（下の locales と対で効く）。
      CFBundleAllowMixedLocalizations: true,
      // 開発ビルドで HTTP backend を使う場合のみ ATS 例外を設定する。
      // - LOCAL_DEV_IOS=1: 実機ローカル検証（localhost / LAN IP も許可）
      // - EXPO_PUBLIC_API_BASE_URL が http:// 始まり: ローカル HTTP backend（nip.io 等）
      // デプロイ環境は HTTPS（sslip.io）なので usesHttpBackend=false となり、例外は焼き込まれない。
      // 本番 iOS ビルド（production / preview）では例外を入れない。
      ...(needsInsecureHttpExceptions
        ? {
            NSAppTransportSecurity: {
              ...(isLocalDevIos ? { NSAllowsArbitraryLoads: true } : {}),
              NSAllowsLocalNetworking: true,
              NSExceptionDomains: {
                'nip.io': {
                  NSIncludesSubdomains: true,
                  NSExceptionAllowsInsecureHTTPLoads: true,
                  NSExceptionRequiresForwardSecrecy: false,
                },
              },
            },
          }
        : {}),
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    package: 'com.kobeinyourpocket.client',
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-dev-client',
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    [
      'expo-location',
      {
        // Info.plist に焼き込まれる既定値。審査は英語環境で行われるため英語にし、
        // ja / ko / zh-Hans は上の locales が InfoPlist.strings で上書きする。
        locationWhenInUsePermission:
          'Your location is shown on the map so we can guide you to nearby sightseeing spots and evacuation shelters, and show how far away they are. Your location stays on your device except when calculating a walking route.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
        iosGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
    'expo-sqlite',
    'expo-secure-store',
    // GoogleSignIn → AppCheckCore 11.3+ が RecaptchaInterop を引き込み、Expo の静的
    // CocoaPods 統合で落ちるため、11.2.0 にピン留めする（issue #1517 の公式回避）。
    [
      'expo-build-properties',
      {
        ios: {
          extraPods: [{ name: 'AppCheckCore', version: '11.2.0' }],
        },
      },
    ],
    // URL スキーム未設定だと plugin がビルドエラーになるため、設定時のみ追加する。
    ...(googleIosUrlScheme
      ? [
          ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [
            string,
            unknown,
          ],
        ]
      : []),
  ],
  // ネイティブの権限ダイアログ・ホーム画面表示名の言語別文字列。
  // prebuild 時に InfoPlist.strings（<lang>.lproj）へ書き出される。
  // アプリ内文言の i18n（src/shared/lib/i18n/locales/）とは別物なので、
  // 権限文言を変えるときは両方ではなくこちらだけを直す。
  // iOS のロケール識別子に合わせるため、中国語は 'zh' ではなく 'zh-Hans'。
  locales: {
    en: './assets/locales/en.json',
    ja: './assets/locales/ja.json',
    ko: './assets/locales/ko.json',
    'zh-Hans': './assets/locales/zh-Hans.json',
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    autolinkingModuleResolution: true,
  },
  extra: {
    eas: {
      projectId: 'c2f0207f-1521-454c-8262-e6f22fea33bb',
    },
  },
});
