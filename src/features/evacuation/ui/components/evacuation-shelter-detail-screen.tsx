import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { openBrowserAsync } from 'expo-web-browser';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEvacuationShelterDetail } from '../../application/hooks/use-evacuation-shelter-detail';

import { ShelterDatasetNotice } from './shelter-dataset-notice';
import { ShelterImage } from './shelter-image';

import { EXTERNAL_LINK_COLOR, styles } from '../styles/evacuation-shelter-detail.styles';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

import { Spacing } from '@/shared/config';
import { confirmOpenDirections } from '@/shared/lib/directions';
import { useCurrentLocation } from '@/shared/lib/geo';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

function BackButton({ label }: { label: string }) {
  const insets = useSafeAreaInsets();

  // 履歴が無い場合（通知・ディープリンクでの直接起動）は一覧へフォールバックする。
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/evacuation');
    }
  };

  return (
    <Pressable
      style={[styles.backButton, { top: insets.top + Spacing.two }]}
      onPress={handleBack}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={Spacing.two}
    >
      <SymbolView
        tintColor="#FFFFFF"
        name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
        size={20}
      />
    </Pressable>
  );
}

function ShelterDetailContent({ shelter }: { shelter: EvacuationShelter }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { coords } = useCurrentLocation();

  const { externalUrl } = shelter;
  const handleOpenExternalLink = useCallback(() => {
    if (!externalUrl) return;
    openBrowserAsync(externalUrl).catch(() => {
      Alert.alert(
        t('evacuation.shelterDetail.linkErrorTitle'),
        t('evacuation.shelterDetail.linkErrorMessage'),
      );
    });
  }, [externalUrl, t]);

  const handleOpenDirections = useCallback(() => {
    confirmOpenDirections(t, shelter.coordinates, { origin: coords });
  }, [t, shelter.coordinates, coords]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <ShelterImage
          imageUrl={shelter.media.imageUrl}
          facilityCategory={shelter.facilityCategory}
          style={styles.heroImage}
        />
      </View>

      <View style={styles.body}>
        <ThemedText style={styles.category}>
          {t(`evacuation.list.category.${shelter.facilityCategory}`)}
        </ThemedText>

        <ThemedText type="subtitle">{shelter.name}</ThemedText>

        <View style={styles.infoRow}>
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
            size={16}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
            {shelter.address}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'shield.fill', android: 'verified_user', web: 'verified_user' }}
            size={16}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
            {t(`evacuation.list.type.${shelter.type}`)}
          </ThemedText>
        </View>

        {shelter.capacity !== undefined ? (
          <View style={styles.infoRow}>
            <SymbolView
              tintColor={theme.textSecondary}
              name={{ ios: 'person.2.fill', android: 'groups', web: 'groups' }}
              size={16}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
              {t('evacuation.list.capacity', { count: shelter.capacity })}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'figure.roll', android: 'accessible', web: 'accessible' }}
            size={16}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.infoText}>
            {shelter.accessible
              ? t('evacuation.list.accessible.yes')
              : t('evacuation.list.accessible.no')}
          </ThemedText>
        </View>

        <Pressable
          style={styles.routeButton}
          onPress={handleOpenDirections}
          accessibilityRole="button"
          accessibilityLabel={t('evacuation.shelterDetail.openDirectionsButton')}
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
            {t('evacuation.shelterDetail.openDirectionsButton')}
          </ThemedText>
        </Pressable>

        {externalUrl ? (
          <Pressable
            style={styles.linkRow}
            onPress={handleOpenExternalLink}
            accessibilityRole="link"
            accessibilityLabel={t('evacuation.shelterDetail.externalLink')}
          >
            <SymbolView
              tintColor={EXTERNAL_LINK_COLOR}
              name={{ ios: 'link', android: 'link', web: 'link' }}
              size={16}
            />
            <ThemedText type="small" style={styles.linkText}>
              {t('evacuation.shelterDetail.externalLink')}
            </ThemedText>
            <SymbolView
              tintColor={EXTERNAL_LINK_COLOR}
              name={{ ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' }}
              size={14}
            />
          </Pressable>
        ) : null}

        <ShelterDatasetNotice />
      </View>
    </ScrollView>
  );
}

/**
 * 避難所詳細を表示する画面コンポーネント。
 * `shelterId` を受け取り `useEvacuationShelterDetail()` 経由で取得する。
 * ルート（app 層）からは ID を渡すだけで描画でき、取得・状態管理は feature 内に閉じる。
 */
export function EvacuationShelterDetailScreen({ shelterId }: { shelterId: string }) {
  const { t } = useTranslation();
  const { data: shelter, isPending, isError } = useEvacuationShelterDetail(shelterId);

  return (
    <ThemedView style={styles.container}>
      {isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : isError || !shelter ? (
        <View style={styles.centered}>
          <ThemedText themeColor="textSecondary">
            {t('evacuation.shelterDetail.loadError')}
          </ThemedText>
        </View>
      ) : (
        <ShelterDetailContent shelter={shelter} />
      )}
      {/* 戻る操作は正常系・異常系を問わず提供する（AC: 戻る操作で一覧へ戻れる）。 */}
      <BackButton label={t('evacuation.shelterDetail.back')} />
    </ThemedView>
  );
}
