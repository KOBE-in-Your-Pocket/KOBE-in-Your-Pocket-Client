import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { RELATED_SPOT_LINK_COLOR, styles } from '../styles/manner-related-spots.styles';

import type { MannerItem } from '../../domain/manner-item';

import { ThemedText } from '@/shared/ui';

/** manner 機能が tourism 機能に依存しないよう、Spot の形を直接importせずこの最小形で受け取る。 */
export type RelatedSpot = {
  id: string;
  name: string;
};

/**
 * 関連スポット（tourism）の取得状態。app 層の `useSpots()` の結果をそのまま束ねて渡す。
 * data だけでなく取得中/失敗も伝えることで、UI 側で「読込中 / 失敗 / なし」を区別できる。
 */
export type RelatedSpotsState = {
  data: RelatedSpot[] | undefined;
  isPending: boolean;
  isError: boolean;
};

/**
 * マナー項目に紐づく観光スポットへのリンクチップ一覧。
 *
 * スポット取得状態（{@link RelatedSpotsState}）を反映し、読込中・失敗・該当なしをそれぞれ
 * i18n 文言で出し分ける。関連スポットがある場合はタップで観光詳細へ遷移するチップを表示する。
 * マナー項目に `relatedSpotIds` が無い場合はスポット取得を待たず「なし」を表示する。
 */
export function MannerRelatedSpots({
  manner,
  state,
}: {
  manner: MannerItem;
  state: RelatedSpotsState;
}) {
  const { t } = useTranslation();
  const hasRelations = manner.relatedSpotIds.length > 0;
  const relatedSpots = state.data?.filter((spot) => manner.relatedSpotIds.includes(spot.id)) ?? [];

  return (
    <View style={styles.relatedSpots}>
      <ThemedText type="small" themeColor="textSecondary">
        {t('manner.detail.relatedSpots')}
      </ThemedText>
      {!hasRelations ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('manner.detail.relatedSpotsEmpty')}
        </ThemedText>
      ) : relatedSpots.length > 0 ? (
        // 手元にリンク可能なデータがあれば、裏の再取得が失敗中（isError）でもまずリンクを表示し、
        // エラー文言でリンクを隠さない。取得状態より「表示できるデータの有無」を優先する。
        <View style={styles.relatedSpotChips}>
          {relatedSpots.map((spot) => (
            <Pressable
              key={spot.id}
              style={styles.relatedSpotChip}
              onPress={() => router.push({ pathname: '/tourism/[id]', params: { id: spot.id } })}
              accessibilityRole="link"
              accessibilityLabel={spot.name}
            >
              <SymbolView
                tintColor={RELATED_SPOT_LINK_COLOR.foreground}
                name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
                size={12}
              />
              <ThemedText type="small" style={styles.relatedSpotText}>
                {spot.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : state.isPending ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('manner.detail.relatedSpotsLoading')}
        </ThemedText>
      ) : state.isError ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('manner.detail.relatedSpotsError')}
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {t('manner.detail.relatedSpotsEmpty')}
        </ThemedText>
      )}
    </View>
  );
}
