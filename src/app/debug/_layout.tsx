import { Redirect, Stack } from 'expo-router';

/**
 * 開発用デバッグ画面のレイアウト。
 *
 * `/debug` 配下は開発時のみ到達可能にする。本番ビルドでは URL スキーム
 * （`kobeinyourpoketclient://debug`）から辿り着ける「隠し機能」と見なされ、
 * App Store Guideline 2.3.1 の指摘対象になるため、ホームへリダイレクトする。
 */
export default function DebugLayout() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Debug' }} />
      <Stack.Screen name="map" options={{ title: 'Map' }} />
      <Stack.Screen name="use-current-location" options={{ title: 'useCurrentLocation' }} />
    </Stack>
  );
}
