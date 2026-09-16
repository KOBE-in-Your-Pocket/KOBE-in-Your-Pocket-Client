import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useSpotDetail } from '../../application/use-spot-detail';

import { styles } from '../styles/spot-detail.styles';

import { SpotDetailContent } from './spot-detail';

import { ThemedText, ThemedView } from '@/shared/ui';

/**
 * 観光スポット詳細を表示する画面コンポーネント。
 *
 * `spotId` を受け取り application 層の `useSpotDetail()` 経由で
 * スポット詳細を取得する。表示は {@link SpotDetailContent} に委譲する。
 * データ取得・状態管理はこの feature 内に閉じる。
 */
export function SpotDetailScreen({ spotId }: { spotId: string }) {
  const { t } = useTranslation();
  const { data: spot, isPending, isError } = useSpotDetail(spotId);

  return (
    <ThemedView style={styles.container}>
      {isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary">{t('tourism.spotDetail.loadError')}</ThemedText>
        </View>
      ) : !spot ? (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary">{t('tourism.spotDetail.notFound')}</ThemedText>
        </View>
      ) : (
        <SpotDetailContent spot={spot} />
      )}
    </ThemedView>
  );
}
