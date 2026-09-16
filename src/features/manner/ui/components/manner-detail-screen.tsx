import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useMannerDetail } from '../hooks/use-manner-detail';

import { styles } from '../styles/manner-detail.styles';

import { MannerDetailContent } from './manner-detail';

import type { RelatedSpotsState } from './manner-related-spots';

import { ThemedText, ThemedView } from '@/shared/ui';

/**
 * マナー項目詳細を表示する画面コンポーネント。
 *
 * `mannerId` を受け取り application 層の {@link useMannerDetail} 経由で詳細を取得する。
 * 表示は {@link MannerDetailContent} に委譲する。データ取得・状態管理はこの feature 内に閉じる。
 * 関連スポットは manner→tourism 依存を避けるため、取得状態ごと app 層から `relatedSpots` として受け取る。
 */
export function MannerDetailScreen({
  mannerId,
  relatedSpots,
}: {
  mannerId: string;
  relatedSpots: RelatedSpotsState;
}) {
  const { t } = useTranslation();
  const { data: manner, isPending, isError } = useMannerDetail(mannerId);

  return (
    <ThemedView style={styles.container}>
      {isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary">{t('manner.detail.loadError')}</ThemedText>
        </View>
      ) : !manner ? (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary">{t('manner.detail.notFound')}</ThemedText>
        </View>
      ) : (
        <MannerDetailContent manner={manner} relatedSpots={relatedSpots} />
      )}
    </ThemedView>
  );
}
