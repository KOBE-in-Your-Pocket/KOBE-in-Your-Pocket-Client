import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { HomeCard as HomeCardDef } from '../home-cards';
import { CARD_FOREGROUND, styles } from '../styles/home-card.styles';

import { ThemedText } from '@/shared/ui';

/** ホームの Quick Access カード 1 枚。アイコン＋ラベル＋説明文で該当機能へ遷移する。 */
export function HomeCard({ card }: { card: HomeCardDef }) {
  const { t } = useTranslation();
  const router = useRouter();
  const label = t(card.labelKey);
  const description = t(card.descriptionKey);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      // 視覚的に追加した説明文をスクリーンリーダーにも伝える。
      accessibilityHint={description}
      onPress={() => router.navigate(card.href)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: card.color },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconHalf}>
        <SymbolView name={card.symbol} tintColor={CARD_FOREGROUND} size={32} style={styles.icon} />
      </View>
      <View style={styles.divider} />
      <View style={styles.labelHalf}>
        <ThemedText type="smallBold" style={[styles.label, { color: CARD_FOREGROUND }]}>
          {label}
        </ThemedText>
        <ThemedText type="small" style={[styles.description, { color: CARD_FOREGROUND }]}>
          {description}
        </ThemedText>
      </View>
    </Pressable>
  );
}
