import Constants from 'expo-constants';

/**
 * 設定画面に表示するアプリのバージョン文字列を返す。
 *
 * `app.config.ts` の `version` を読む。取得できない環境（テストなど）では null。
 * ビルド番号は EAS のリモート版数管理（`appVersionSource: "remote"`）で採番され
 * アプリ設定には現れないため、ここでは扱わない。
 */
export function getAppVersion(): string | null {
  return Constants.expoConfig?.version ?? null;
}
