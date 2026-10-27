import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { styles } from '../styles/home-hero.styles';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

// 左上が濃く右下へ斜めにフェードするよう加工したアプリアイコン（scripts/gen-hero-icon.js で生成）。
// ストア / ランチャーと同じデザインをホームのヒーロー背景に流用する。
const APP_ICON = require('@/assets/images/app-icon-hero.png');

/**
 * ホームのヒーロー。背景にアプリアイコン（左上が濃く、右下へ向けて斜めにフェード）を大きく敷き、
 * 右寄せのキャッチフレーズを重ねる。アイコンはフェード側に文字を置くため文字と重ならない。
 */
export function HomeHero() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.hero, { backgroundColor: theme.background }]}>
      {/* 背景装飾のアプリアイコン（斜めフェード済み）。スクリーンリーダーには読み上げさせない。 */}
      <Image source={APP_ICON} style={styles.emblem} contentFit="contain" accessible={false} />

      <View style={styles.catchphrase}>
        <ThemedText style={styles.line}>{t('home.catchphrase.line1')}</ThemedText>
        <ThemedText style={styles.line}>{t('home.catchphrase.line2')}</ThemedText>
        <ThemedText style={styles.line}>{t('home.catchphrase.line3')}</ThemedText>
        <ThemedText style={styles.tagline}>{t('home.catchphrase.tagline')}</ThemedText>
      </View>
    </View>
  );
}
