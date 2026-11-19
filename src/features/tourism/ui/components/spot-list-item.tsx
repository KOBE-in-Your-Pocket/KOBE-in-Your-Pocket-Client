import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Spot } from '../../domain/spot';

import { RATING_STAR_COLOR, styles } from '../../ui/styles/spot-list.styles';
import { useRecordSpotView } from '../hooks/use-record-spot-view';

import { SpotFavoriteButton } from './spot-favorite-button';

import { formatDistanceKm } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

export type SpotWithDistance = Spot & {
  /** 現在地からの距離。null なら距離のバッジを出さない。 */
  distanceKm: number | null;
};

/**
 * 観光スポットの一覧の 1 行（観光一覧・お気に入り一覧で共通）。
 *
 * 押すと詳細へ移る行・経路ボタン・お気に入りマークを持つ。
 */
export function SpotListItem({ spot }: { spot: SpotWithDistance }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const recordSpotView = useRecordSpotView();

  // カードから詳細へ移るときに閲覧を 1 回数える（#835）。詳細から戻ったときは押されないので数えない。
  const handleOpenDetail = () => {
    recordSpotView(spot.id);
    router.push({ pathname: '/tourism/[id]', params: { id: spot.id } });
  };

  // 詳細へ移る行・経路・お気に入りの 3 つを、入れ子にせず兄弟として並べる（#793）。
  // Pressable はアクセシビリティ上 1 つの要素として子をまとめるため、入れ子にすると
  // VoiceOver・TalkBack で中のボタンに移動できなくなる。
  return (
    <ThemedView style={styles.card}>
      <View style={styles.cardInner}>
        <Pressable
          onPress={handleOpenDetail}
          accessibilityRole="button"
          accessibilityLabel={spot.name}
        >
          <View style={styles.imageWrapper}>
            <Image source={{ uri: spot.media.imageUrl }} style={styles.image} contentFit="cover" />
          </View>

          <View style={[styles.content, styles.contentPressable]}>
            <View style={styles.metaRow}>
              <ThemedText style={styles.category}>{spot.category.label}</ThemedText>
              {spot.rating ? (
                <View style={styles.ratingRow}>
                  <SymbolView
                    tintColor={RATING_STAR_COLOR}
                    name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                    size={14}
                  />
                  <ThemedText type="smallBold">{spot.rating.value.toFixed(1)}</ThemedText>
                </View>
              ) : null}
            </View>

            <ThemedText type="smallBold" style={styles.name}>
              {spot.name}
            </ThemedText>

            <ThemedText
              type="small"
              themeColor="textSecondary"
              numberOfLines={3}
              style={styles.description}
            >
              {spot.description}
            </ThemedText>

            <View style={styles.hoursRow}>
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
        </Pressable>

        <View style={styles.routeRow}>
          <Pressable
            style={styles.routeButton}
            // requestedAt は押下ごとに変わる値。同じスポットへの再遷移でも地図側でカードを再表示させる。
            // push だと (tabs) が積み上がり地図が二重になる（#802）ため、navigate で既存の (tabs) に戻す。
            onPress={() =>
              router.navigate({
                pathname: '/map',
                params: { spotId: spot.id, requestedAt: String(Date.now()) },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={t('tourism.spotList.routeButton')}
          >
            <SymbolView
              tintColor="#FFFFFF"
              name={{
                ios: 'arrow.triangle.turn.up.right.diamond.fill',
                android: 'directions',
                web: 'directions',
              }}
              size={16}
            />
            <ThemedText style={styles.routeButtonText}>
              {t('tourism.spotList.routeButton')}
            </ThemedText>
          </Pressable>
        </View>

        {/* 画像の右上に、距離とお気に入りマークを重ねる。box-none で、マーク以外を押したときは
            下の行（詳細へ移る）にタップを通す。 */}
        <View style={styles.topRight} pointerEvents="box-none">
          {spot.distanceKm !== null ? (
            // 距離は今までどおり行の一部として扱い、タップも読み上げも単独では拾わない。
            <View
              style={styles.distanceBadge}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <ThemedText style={styles.distanceText}>
                {formatDistanceKm(spot.distanceKm)}
              </ThemedText>
            </View>
          ) : null}
          <SpotFavoriteButton spotId={spot.id} variant="overlay" />
        </View>
      </View>
    </ThemedView>
  );
}
