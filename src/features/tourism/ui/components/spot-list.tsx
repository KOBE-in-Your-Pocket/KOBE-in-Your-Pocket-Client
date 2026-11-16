import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFilteredSpots } from '../../application/use-filtered-spots';

import { styles } from '../../ui/styles/spot-list.styles';

import { GenreFilter } from './genre-filter';
import { SpotListItem, type SpotWithDistance } from './spot-list-item';

import { Spacing } from '@/shared/config';
import { getDistanceKm, useCurrentLocation } from '@/shared/lib/geo';
import { ThemedText, ThemedView } from '@/shared/ui';

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
  const { data: spots, isPending, isError, refetch } = useFilteredSpots();
  const { coords } = useCurrentLocation();
  // 背景の再取得ではくるくるを出さず、引っ張って更新したときだけ出す。
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

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
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    />
  );
}
