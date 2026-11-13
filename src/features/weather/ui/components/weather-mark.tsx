import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWeather } from '../../application/use-weather';
import { getWeatherMarkKind } from '../../domain/weather-mark';

import { styles } from '../styles/weather-mark.styles';
import { WEATHER_MARK_IMAGE_MAP } from './weather-mark-image-map';

import { Spacing } from '@/shared/config';
import { useTheme, useThemeScheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

/** 強い雨のときの注意の色（テーマのトークンに無いため、ここでライト / ダークを持つ）。 */
const HEAVY_RAIN_COLOR = { light: '#D32F2F', dark: '#FF6B6B' } as const;

export type WeatherMarkProps = {
  /** 地図上部の基準位置（insets.top + Spacing.three）から、さらに下げる量。 */
  topOffset?: number;
};

/**
 * 地図上部に浮かせる天気マーク。今の天気のマークと種類の名前を出す（#783）。
 * 天気がまだ取れていないときは何も出さない。
 */
export function WeatherMark({ topOffset = 0 }: WeatherMarkProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const scheme = useThemeScheme();
  const insets = useSafeAreaInsets();
  const { data: weather } = useWeather();

  if (!weather) return null;

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
          top: insets.top + Spacing.three + topOffset,
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
