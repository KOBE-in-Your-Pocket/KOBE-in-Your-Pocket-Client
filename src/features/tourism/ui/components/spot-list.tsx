import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFilteredSpots } from '../../application/use-filtered-spots';

import type { Spot } from '../../domain/spot';

import { RATING_STAR_COLOR, styles } from '../../ui/styles/spot-list.styles';

import { GenreFilter } from './genre-filter';

import { Spacing } from '@/shared/config';
import { formatDistanceKm, getDistanceKm, useCurrentLocation } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

type SpotWithDistance = Spot & {
  distanceKm: number | null;
};

function SpotListItem({ spot }: { spot: SpotWithDistance }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/tourism/[id]', params: { id: spot.id } })}
      accessibilityRole="button"
      accessibilityLabel={spot.name}
    >
      <ThemedView style={styles.card}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: spot.media.imageUrl }} style={styles.image} contentFit="cover" />
          {spot.distanceKm !== null ? (
            <View style={styles.distanceBadge}>
              <ThemedText style={styles.distanceText}>
                {formatDistanceKm(spot.distanceKm)}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
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

          <Pressable
            style={styles.routeButton}
            onPress={() => router.push({ pathname: '/map', params: { spotId: spot.id } })}
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
      </ThemedView>
    </Pressable>
  );
}

function ListHeader({ showGenreFilter }: { showGenreFilter: boolean }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
      <ThemedText type="subtitle" style={styles.title}>
        {t('tourism.spotList.title')}
      </ThemedText>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {t('tourism.spotList.subtitle')}
      </ThemedText>
      {showGenreFilter ? <GenreFilter /> : null}
    </View>
  );
}

/**
 * 観光スポット一覧を表示するコンポーネント。
 *
 * application 層の `useFilteredSpots()` 経由でデータを取得し、各スポットの
 * 画像・距離・評価・営業時間を含むカード一覧を表示する。
 */
export function SpotList({
  showGenreFilter = true,
  showHeader = true,
}: {
  showGenreFilter?: boolean;
  showHeader?: boolean;
}) {
  const { t } = useTranslation();
  const { data: spots, isPending, isError } = useFilteredSpots();
  const { coords } = useCurrentLocation();

  const renderListHeader = useCallback(
    () => <ListHeader showGenreFilter={showGenreFilter} />,
    [showGenreFilter],
  );

  const spotsWithDistance = useMemo((): SpotWithDistance[] | undefined => {
    if (!spots) return undefined;

    const withDistance = spots.map((spot) => ({
      ...spot,
      distanceKm: coords
        ? getDistanceKm(
            { latitude: coords.latitude, longitude: coords.longitude },
            spot.coordinates,
          )
        : null,
    }));

    if (!coords) return withDistance;

    return [...withDistance].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [coords, spots]);

  if (isPending) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">{t('tourism.spotList.loadError')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={spotsWithDistance}
      keyExtractor={(spot) => spot.id}
      renderItem={({ item }) => <SpotListItem spot={item} />}
      ListHeaderComponent={showHeader ? renderListHeader : undefined}
      contentContainerStyle={styles.listContent}
    />
  );
}
