import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { ShelterType } from '../../domain/evacuation-shelter';

import { SHELTER_TYPE_BADGE, styles } from '../styles/shelter-type-badge.styles';

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
  const { color, background, icon } = SHELTER_TYPE_BADGE[type];
  const label = t(`evacuation.shelterDetail.typeBadge.${type}.label`);
  const description = t(`evacuation.shelterDetail.typeBadge.${type}.description`);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}。${description}`}
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
