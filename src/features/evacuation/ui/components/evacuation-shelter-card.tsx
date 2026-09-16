import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { confirmOpenDirections } from '@/shared/lib/directions';
import { formatDistanceKm, getDistanceKm, type GeoCoordinates } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { ShelterImage } from './shelter-image';

import { styles } from '../styles/evacuation-shelter-card.styles';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

type EvacuationShelterCardProps = {
  shelter: EvacuationShelter;
  /** 現在地。距離計算・経路の起点に使う。取得前は `null`。 */
  currentLocation: GeoCoordinates | null;
  onClose: () => void;
  onDetail: () => void;
};

/** 地図で避難所ピンを選択したときに表示する避難所情報カード（SpotCard 相当）。 */
export function EvacuationShelterCard({
  shelter,
  currentLocation,
  onClose,
  onDetail,
}: EvacuationShelterCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const distanceKm = currentLocation ? getDistanceKm(currentLocation, shelter.coordinates) : null;

  const handleNavigate = () => {
    confirmOpenDirections(t, shelter.coordinates, { origin: currentLocation });
  };

  return (
    <ThemedView style={styles.card}>
      <View style={styles.imageWrapper}>
        <ShelterImage
          imageUrl={shelter.media.imageUrl}
          facilityCategory={shelter.facilityCategory}
          style={styles.image}
        />
        <View style={styles.scrim} />

        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('evacuation.shelterCard.close')}
        >
          <SymbolView
            tintColor="#FFFFFF"
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={14}
          />
        </Pressable>

        <View style={styles.imageContent}>
          <ThemedText style={styles.category}>
            {t(`evacuation.list.category.${shelter.facilityCategory}`).toUpperCase()}
          </ThemedText>
          <ThemedText style={styles.name} numberOfLines={1}>
            {shelter.name}
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText
          type="small"
          themeColor="textSecondary"
          numberOfLines={2}
          style={styles.address}
        >
          {shelter.address}
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

          {shelter.capacity !== undefined ? (
            <View style={styles.metaItem}>
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
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onDetail}
            style={[styles.actionButton, styles.detailButton]}
            accessibilityRole="button"
            accessibilityLabel={t('evacuation.shelterCard.detail')}
          >
            <ThemedText style={styles.detailButtonText}>
              {t('evacuation.shelterCard.detail')}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handleNavigate}
            style={[styles.actionButton, styles.navButton]}
            accessibilityRole="button"
            accessibilityLabel={t('evacuation.shelterCard.navigate')}
          >
            <SymbolView
              tintColor="#FFFFFF"
              name={{ ios: 'location.north.fill', android: 'near_me', web: 'near_me' }}
              size={14}
            />
            <ThemedText style={styles.navButtonText}>
              {t('evacuation.shelterCard.navigate')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}
