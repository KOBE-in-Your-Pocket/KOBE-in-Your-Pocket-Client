import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { ShelterType } from '../../domain/evacuation-shelter';

import {
  SHELTER_TYPE_BADGE,
  styles,
  type ShelterTypeBadgeStyle,
} from '../styles/shelter-type-badge.styles';

import { useThemeScheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

/**
 * 避難所の区分（指定緊急避難場所 / 指定避難所 / 兼用）を、色・アイコン・ラベルの
 * ステータスバッジで表示する。プレーンなテキスト行だと他の情報（住所・収容人数など）に
 * 埋もれて区分が判別しづらいため、名称直下に目立つバッジとして出す。
 * 「緊急」「兼用」など一言では伝わりにくいので、正式名称のラベルに加えて
 * 「どういう場所か」を一行の説明文で添え、緊急避難場所か滞在用の指定避難所かを
 * 一目で判別できるようにする。
 */
export function ShelterTypeBadge({ type }: { type: ShelterType }) {
  const { t } = useTranslation();
  const scheme = useThemeScheme();
  // バックエンドの値をそのまま通す（evacuation-shelter-mapper.ts）ため、未知の区分が来うる。
  // 定義が無い区分では、誤った色・アイコンで誤認させないよう fallback 表示ではなくバッジ自体を出さない。
  const badge: ShelterTypeBadgeStyle | undefined = SHELTER_TYPE_BADGE[type];
  if (!badge) return null;

  const { icon } = badge;
  const { color, background } = badge[scheme];
  const label = t(`evacuation.shelterDetail.typeBadge.${type}.label`);
  const description = t(`evacuation.shelterDetail.typeBadge.${type}.description`);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      // 区切り文字は言語ごとに異なるため、i18n テンプレート側で解決する（shelter-suitability と同方式）。
      accessibilityLabel={t('evacuation.shelterDetail.typeBadge.accessibilityLabel', {
        label,
        description,
      })}
    >
      <View style={[styles.badge, { backgroundColor: background, borderColor: color }]}>
        <SymbolView tintColor={color} name={icon} size={16} />
        <ThemedText style={[styles.label, { color }]}>{label}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.description}>
        {description}
      </ThemedText>
    </View>
  );
}
