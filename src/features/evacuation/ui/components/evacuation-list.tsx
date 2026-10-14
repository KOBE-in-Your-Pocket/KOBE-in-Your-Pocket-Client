import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  sortSheltersByDistance,
  type ShelterWithDistance,
} from '../../application/use-cases/sort-shelters-by-distance';
import { useFilteredShelters } from '../../application/hooks/use-filtered-shelters';

import { DisasterFilter } from './disaster-filter';
import { ShelterDatasetNotice } from './shelter-dataset-notice';

import { styles } from '../styles/evacuation-list.styles';

import { Spacing } from '@/shared/config';
import { formatDistanceKm, useCurrentLocation } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

function ShelterListItem({
  shelter,
  isNearest,
}: {
  shelter: ShelterWithDistance;
  isNearest: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/evacuation/[id]', params: { id: shelter.id } })}
      accessibilityRole="button"
      accessibilityLabel={shelter.name}
    >
      <ThemedView style={styles.card}>
        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <ThemedText style={styles.category}>
              {t(`evacuation.list.category.${shelter.facilityCategory}`)}
            </ThemedText>
            {isNearest ? (
              <View style={styles.nearestBadge}>
                <ThemedText style={styles.nearestBadgeText}>
                  {t('evacuation.list.nearest')}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <ThemedText style={styles.name}>{shelter.name}</ThemedText>

          <ThemedText type="small" themeColor="textSecondary" style={styles.address}>
            {shelter.address}
          </ThemedText>

          {shelter.distanceKm !== null || shelter.capacity !== undefined || shelter.phoneNumber ? (
            <View style={styles.infoRow}>
              {shelter.distanceKm !== null ? (
                <View style={styles.infoItem}>
                  <SymbolView
                    tintColor={theme.textSecondary}
                    name={{ ios: 'location.north.fill', android: 'near_me', web: 'near_me' }}
                    size={14}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatDistanceKm(shelter.distanceKm)}
                  </ThemedText>
                </View>
              ) : null}

              {shelter.capacity !== undefined ? (
                <View style={styles.infoItem}>
                  <SymbolView
                    tintColor={theme.textSecondary}
                    name={{ ios: 'person.2.fill', android: 'groups', web: 'groups' }}
                    size={14}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('evacuation.list.capacity', { count: shelter.capacity })}
                  </ThemedText>
                </View>
              ) : null}

              {shelter.phoneNumber ? (
                <View style={styles.infoItem}>
                  <SymbolView
                    tintColor={theme.textSecondary}
                    name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
                    size={14}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('evacuation.shelterCard.phoneLabel')}: {shelter.phoneNumber}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ThemedView>
    </Pressable>
  );
}

function ListHeader({
  showHeader,
  permissionDenied,
  servicesDisabled,
}: {
  showHeader: boolean;
  permissionDenied: boolean;
  servicesDisabled: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={
        showHeader ? [styles.header, { paddingTop: insets.top + Spacing.three }] : styles.headerless
      }
    >
      {showHeader ? (
        <>
          <ThemedText type="subtitle" style={styles.title}>
            {t('evacuation.list.title')}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t('evacuation.list.subtitle')}
          </ThemedText>
        </>
      ) : null}

      {permissionDenied || servicesDisabled ? (
        <View style={styles.locationBanner}>
          <ThemedText type="smallBold" style={styles.locationBannerText}>
            {permissionDenied
              ? t('location.permissionDeniedNotice')
              : t('evacuation.list.locationServicesDisabled')}
          </ThemedText>
        </View>
      ) : null}

      <DisasterFilter />
    </View>
  );
}

/**
 * 避難所一覧を表示するコンポーネント。
 *
 * application 層の `useFilteredShelters()` 経由でデータを取得し、各避難所の
 * 画像・距離・施設種別・収容人数・電話番号を含むカード一覧を表示する。
 * 一覧の上の災害種別タグで絞り込める。絞り込みは取得済みの配列に対して行うため、
 * 通信なしで動く。
 */
export function EvacuationList({ showHeader = true }: { showHeader?: boolean } = {}) {
  const { t } = useTranslation();
  const { data: shelters, isPending, isError, isFiltered } = useFilteredShelters();
  const { coords, permissionDenied, servicesDisabled } = useCurrentLocation();

  // 絞り込み済みの一覧を距離順に並べる。「最寄り」バッジは絞り込み後の先頭に付く。
  const sheltersWithDistance = useMemo((): ShelterWithDistance[] | undefined => {
    if (!shelters) return undefined;

    return sortSheltersByDistance(shelters, coords);
  }, [coords, shelters]);

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
        <ThemedText themeColor="textSecondary">{t('evacuation.list.loadError')}</ThemedText>
      </ThemedView>
    );
  }

  // 絞り込みで 0 件になったときはタグを残して選択を外せるよう、FlatList の ListEmptyComponent で出す。
  if (!sheltersWithDistance || (sheltersWithDistance.length === 0 && !isFiltered)) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText themeColor="textSecondary">{t('evacuation.list.empty')}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={sheltersWithDistance}
      keyExtractor={(shelter) => shelter.id}
      renderItem={({ item, index }) => (
        <ShelterListItem shelter={item} isNearest={coords !== null && index === 0} />
      )}
      ListHeaderComponent={
        <ListHeader
          showHeader={showHeader}
          permissionDenied={permissionDenied}
          servicesDisabled={servicesDisabled}
        />
      }
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.filterEmpty}>
          {t('evacuation.list.filterEmpty')}
        </ThemedText>
      }
      ListFooterComponent={<ShelterDatasetNotice />}
      contentContainerStyle={styles.listContent}
    />
  );
}
