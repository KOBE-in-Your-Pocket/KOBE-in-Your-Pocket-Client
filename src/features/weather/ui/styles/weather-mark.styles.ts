import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 天気マークの高さ。下に重ねる要素（検索 0 件の案内など）の位置計算にも使う。 */
export const WEATHER_MARK_HEIGHT = 40;

const ICON_SIZE = 28;

export const styles = StyleSheet.create({
  // 地図左上に浮かせる。top は insets.top を加算して動的に設定する（MapSettingsButton と同じ）。
  // 右上の MapSettingsButton と重ならないよう、幅は中身に合わせる。
  container: {
    position: 'absolute',
    left: Spacing.three,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    height: WEATHER_MARK_HEIGHT,
    borderRadius: WEATHER_MARK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingLeft: Spacing.two,
    paddingRight: Spacing.three,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
