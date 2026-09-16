import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Spot } from '@/features/tourism';
import { formatDistanceKm } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { RATING_STAR_COLOR, styles } from '../styles/spot-card.styles';

type SpotCardProps = {
  spot: Spot;
  /** 現在地からの直線距離（km）。取得前は `null`。 */
  distanceKm: number | null;
  /** 閉じるボタン押下時のコールバック。 */
  onClose: () => void;
  /** 「詳細を見る」押下時のコールバック（詳細ページが未実装の間は未配線）。 */
  onDetail: () => void;
  /** 「経路案内」押下時のコールバック。 */
  onNavigate: () => void;
};

/**
 * 地図のピン選択時に表示するスポット情報カード。
 *
 * 画像の上にカテゴリ・名称・評価を重ね、下段に距離・営業時間と詳細ボタンを並べる。
 */
export function SpotCard({ spot, distanceKm, onClose, onDetail, onNavigate }: SpotCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: spot.media.imageUrl }} style={styles.image} contentFit="cover" />
        <View style={styles.scrim} />

        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('map.spotCard.close')}
        >
          <SymbolView
            tintColor="#FFFFFF"
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={14}
          />
        </Pressable>

        <View style={styles.imageContent}>
          <ThemedText style={styles.category}>{spot.category.label.toUpperCase()}</ThemedText>
          <View style={styles.titleRow}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {spot.name}
            </ThemedText>
            {spot.rating ? (
              <View style={styles.ratingRow}>
                <SymbolView
                  tintColor={RATING_STAR_COLOR}
                  name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                  size={15}
                />
                <ThemedText style={styles.ratingText}>{spot.rating.value.toFixed(1)}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          numberOfLines={2}
          style={styles.description}
        >
          {spot.description}
        </ThemedText>

        <View style={styles.metaRow}>
          {distanceKm !== null ? (
            <View style={styles.metaItem}>
              <SymbolView
                tintColor={theme.textSecondary}
                name={{ ios: 'location.north.fill', android: 'near_me', web: 'near_me' }}
                size={14}
              />
              <ThemedText type="small" themeColor="textSecondary">
                {formatDistanceKm(distanceKm)}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.metaItem}>
            <SymbolView
              tintColor={theme.textSecondary}
              name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
              size={14}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {spot.businessHours}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onDetail}
            style={[styles.actionButton, styles.detailButton]}
            accessibilityRole="button"
            accessibilityLabel={t('map.spotCard.detail')}
          >
            <ThemedText style={styles.detailButtonText}>{t('map.spotCard.detail')}</ThemedText>
          </Pressable>

          <Pressable
            onPress={onNavigate}
            style={[styles.actionButton, styles.navButton]}
            accessibilityRole="button"
            accessibilityLabel={t('map.spotCard.navigate')}
          >
            <SymbolView
              tintColor="#FFFFFF"
              name={{
                ios: 'location.north.fill',
                android: 'near_me',
                web: 'near_me',
              }}
              size={14}
            />
            <ThemedText style={styles.navButtonText}>{t('map.spotCard.navigate')}</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}
