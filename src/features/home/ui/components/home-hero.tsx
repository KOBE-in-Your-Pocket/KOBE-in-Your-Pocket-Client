import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { styles } from '../styles/home-hero.styles';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

const KOBE_EMBLEM = require('@/assets/images/kobe-emblem.png');

/**
 * ホームのヒーロー。背景に神戸市章（右下へ向けて白へフェードするグラデーション）を大きく敷き、
 * 右寄せのキャッチフレーズを重ねる。市章はフェード側に文字を置くため文字と重ならない。
 */
export function HomeHero() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.hero, { backgroundColor: theme.background }]}>
      {/* 背景装飾の市章。スクリーンリーダーには読み上げさせない。 */}
      <Image source={KOBE_EMBLEM} style={styles.emblem} contentFit="contain" accessible={false} />

      <View style={styles.catchphrase}>
        <ThemedText style={styles.line}>{t('home.catchphrase.line1')}</ThemedText>
        <ThemedText style={styles.line}>{t('home.catchphrase.line2')}</ThemedText>
        <ThemedText style={styles.line}>{t('home.catchphrase.line3')}</ThemedText>
        <ThemedText style={styles.tagline}>{t('home.catchphrase.tagline')}</ThemedText>
      </View>
    </View>
  );
}
