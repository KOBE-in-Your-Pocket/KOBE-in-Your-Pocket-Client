import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/shared/ui';

import { KIND_BADGE_COLORS, KIND_BADGE_ICONS, styles } from '../styles/kind-badge.styles';

import type { MannerKind } from '../../domain/manner-item';

type KindBadgeProps = {
  kind: MannerKind;
};

/**
 * マナー項目の分類（マナー / ルール）を色・アイコン・バッジで視覚的に区別する。
 * ルールはマナーより一段強調し、注意すべき法令・条例上のルールであることが伝わるようにする。
 */
export function KindBadge({ kind }: KindBadgeProps) {
  const { t } = useTranslation();
  const colors = KIND_BADGE_COLORS[kind];
  const label = t(`manner.kind.${kind}`);

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.background, borderColor: colors.border }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <SymbolView tintColor={colors.foreground} name={KIND_BADGE_ICONS[kind]} size={14} />
      <ThemedText style={[styles.label, { color: colors.foreground }]}>{label}</ThemedText>
    </View>
  );
}
