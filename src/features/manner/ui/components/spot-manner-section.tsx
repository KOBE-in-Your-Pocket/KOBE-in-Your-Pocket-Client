import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useSpotManners } from '../../application/use-spot-manners';

import type { MannerItem } from '../../domain/manner-item';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

import { KIND_ACCENT_COLOR, KIND_CARD_BACKGROUND_SUBTLE } from '../styles/kind-badge.styles';
import { styles } from '../styles/spot-manner-section.styles';

import { KindBadge } from './kind-badge';
import { MannerPictogram } from './manner-pictogram';

function SpotMannerItem({ manner }: { manner: MannerItem }) {
  const theme = useTheme();
  const accent = KIND_ACCENT_COLOR[manner.kind];

  return (
    <ThemedView
      style={[
        styles.card,
        { backgroundColor: KIND_CARD_BACKGROUND_SUBTLE[manner.kind], borderColor: accent },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: theme.backgroundElement }]}>
        <MannerPictogram manner={manner} size={32} />
      </View>

      <View style={styles.content}>
        <KindBadge kind={manner.kind} />
        <ThemedText style={[styles.itemTitle, { color: accent }]}>{manner.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.itemDescription}>
          {manner.description}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

type SpotMannerSectionProps = {
  spotId: string;
};

/**
 * 観光名所詳細向けの「この場所のマナー」セクション。
 *
 * application 層の {@link useSpotManners} でスポット固有のマナーを取得し、
 * タイトル・短い説明・KindBadge をコンパクトに表示する。
 * 該当マナーが無い・取得中・取得失敗時は何も描画しない。
 */
export function SpotMannerSection({ spotId }: SpotMannerSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: manners, isPending, isError } = useSpotManners(spotId);

  if (isPending || isError || manners === undefined || manners.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionTitleDivider, { backgroundColor: theme.textSecondary }]} />
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          {t('manner.spotSection.title')}
        </ThemedText>
        <View style={[styles.sectionTitleDivider, { backgroundColor: theme.textSecondary }]} />
      </View>

      <View style={styles.itemList}>
        {manners.map((manner) => (
          <SpotMannerItem key={manner.id} manner={manner} />
        ))}
      </View>
    </View>
  );
}
