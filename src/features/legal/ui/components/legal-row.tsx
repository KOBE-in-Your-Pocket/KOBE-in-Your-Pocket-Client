import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

/**
 * 設定画面の 1 行。タップできる行（`onPress` あり）と、値を表示するだけの行
 * （バージョンなど）の両方に使う。行の見た目は user feature の AccountSection と揃える。
 */
export function LegalRow({
  label,
  value,
  onPress,
  accessibilityRole = 'button',
}: {
  label: string;
  /** 右端に出す値。指定した場合は矢印の代わりに表示する。 */
  value?: string;
  /** 未指定なら押せない行として描画する。 */
  onPress?: () => void;
  accessibilityRole?: 'button' | 'link';
}) {
  const theme = useTheme();

  const content = (
    <>
      <ThemedText type="default" style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
      {value !== undefined ? (
        <ThemedText type="default" themeColor="textSecondary">
          {value}
        </ThemedText>
      ) : (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          tintColor={theme.textSecondary}
          size={16}
        />
      )}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>{content}</View>
    );
  }

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  label: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
