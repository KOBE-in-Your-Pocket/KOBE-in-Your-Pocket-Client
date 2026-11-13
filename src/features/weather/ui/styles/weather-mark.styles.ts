import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 天気マークの高さ。下に重ねる要素（検索 0 件の案内など）の位置計算にも使う。 */
export const WEATHER_MARK_HEIGHT = 40;

const ICON_SIZE = 30;

export const styles = StyleSheet.create({
  // 地図左上に浮かせる丸いアイコン（右上の MapSettingsButton と同じ大きさ）。
  // top は insets.top を加算して動的に設定する（MapSettingsButton と同じ）。
  container: {
    position: 'absolute',
    left: Spacing.three,
    zIndex: 1,
    width: WEATHER_MARK_HEIGHT,
    height: WEATHER_MARK_HEIGHT,
    borderRadius: WEATHER_MARK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
