import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeCard } from './home-card';
import { HomeHero } from './home-hero';

import { HOME_CARDS } from '../home-cards';
import { styles } from '../styles/home-screen.styles';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleBlock}>
            <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
            <ThemedText type="title" style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              {t('common.appName')}
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
          </View>

          <HomeHero />

          <View style={styles.grid}>
            {HOME_CARDS.map((card) => (
              <HomeCard key={card.labelKey} card={card} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
