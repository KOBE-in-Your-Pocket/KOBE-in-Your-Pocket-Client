import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWeather } from '../../application/use-weather';
import { isWeatherOutdated } from '../../domain/weather';
import { getWeatherMarkKind } from '../../domain/weather-mark';

import { styles } from '../styles/weather-mark.styles';
import { WEATHER_MARK_IMAGE_MAP } from './weather-mark-image-map';

import { Spacing } from '@/shared/config';
import { useTheme, useThemeScheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

/** 強い雨のときの注意の色（テーマのトークンに無いため、ここでライト / ダークを持つ）。 */
const HEAVY_RAIN_COLOR = { light: '#D32F2F', dark: '#FF6B6B' } as const;

// データの古さを判定し直す間隔。地図を開いたままでも 30 分を過ぎたら表示が切り替わるようにする
const NOW_REFRESH_INTERVAL_MS = 60 * 1000;

/** 今の時刻（エポックミリ秒）を一定間隔で更新して返す。 */
function useNowMs(intervalMs: number): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return nowMs;
}

export type WeatherMarkProps = {
  /** 地図上部の基準位置（insets.top + Spacing.three）から、さらに下げる量。 */
  topOffset?: number;
};

/**
 * 地図上部に浮かせる天気マーク。今の天気のマークと種類の名前を出す（#783）。
 * 取得中は何も出さない。取得に失敗したとき・データが古すぎるときは「天気を取得できませんでした」を出す（#784）。
 */
export function WeatherMark({ topOffset = 0 }: WeatherMarkProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const scheme = useThemeScheme();
  const insets = useSafeAreaInsets();
  const { data: weather, isPending } = useWeather();
  const nowMs = useNowMs(NOW_REFRESH_INTERVAL_MS);

  if (isPending) return null;

  const top = insets.top + Spacing.three + topOffset;

  // 失敗しても前回取得できたデータが新しければ、そちらを出す
  if (!weather || isWeatherOutdated(weather, nowMs)) {
    const message = t('weather.unavailable');
    return (
      <View
        testID="weather-mark-unavailable"
        style={[
          styles.container,
          styles.unavailableContainer,
          { top, backgroundColor: theme.backgroundElement },
        ]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={message}
      >
        <ThemedText style={styles.unavailableLabel} themeColor="textSecondary">
          {message}
        </ThemedText>
      </View>
    );
  }

  const kind = getWeatherMarkKind(weather);
  const label = t(`weather.kind.${kind}`);
  const isHeavyRain = kind === 'heavyRain';
  const heavyRainColor = HEAVY_RAIN_COLOR[scheme];

  return (
    <View
      testID="weather-mark"
      style={[
        styles.container,
        {
          top,
          backgroundColor: theme.backgroundElement,
        },
        isHeavyRain && { borderColor: heavyRainColor },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('weather.accessibilityLabel', { kind: label })}
    >
      <Image
        testID={`weather-mark-icon-${kind}`}
        source={WEATHER_MARK_IMAGE_MAP[kind]}
        style={styles.icon}
        contentFit="contain"
      />
      <ThemedText style={[styles.label, isHeavyRain && { color: heavyRainColor }]}>
        {label}
      </ThemedText>
    </View>
  );
}
