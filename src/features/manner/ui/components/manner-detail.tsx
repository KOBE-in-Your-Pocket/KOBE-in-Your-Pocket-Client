import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KIND_ACCENT_COLOR, KIND_CARD_BACKGROUND } from '../styles/kind-badge.styles';
import { styles } from '../styles/manner-detail.styles';

import type { MannerItem } from '../../domain/manner-item';

import { Spacing } from '@/shared/config';
import { ThemedText } from '@/shared/ui';

import { KindBadge } from './kind-badge';
import { MannerPictogram } from './manner-pictogram';
import { MannerRelatedSpots, type RelatedSpotsState } from './manner-related-spots';

function BackButton({ label }: { label: string }) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.backButton, { top: insets.top + Spacing.two }]}
      onPress={() => router.back()}
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

/**
 * 取得済みマナー項目の詳細 UI。
 *
 * 観光スポット詳細と同じイメージで、ヒーロー領域に大きくピクトグラムを表示し、
 * その下にバッジ・タイトル・詳細（説明）・関連スポットを並べる。
 */
export function MannerDetailContent({
  manner,
  relatedSpots,
}: {
  manner: MannerItem;
  relatedSpots: RelatedSpotsState;
}) {
  const { t } = useTranslation();
  const accent = KIND_ACCENT_COLOR[manner.kind];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={[styles.hero, { backgroundColor: KIND_CARD_BACKGROUND[manner.kind] }]}>
        <MannerPictogram manner={manner} size={140} />
        <BackButton label={t('manner.detail.back')} />
      </View>

      <View style={styles.body}>
        <KindBadge kind={manner.kind} />
        <ThemedText style={[styles.title, { color: accent }]}>{manner.title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.description}>
          {manner.description}
        </ThemedText>
        <MannerRelatedSpots manner={manner} state={relatedSpots} />
      </View>
    </ScrollView>
  );
}
