import { SymbolView } from 'expo-symbols';
import { TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';

import { styles } from '../styles/tab-button.styles';
import { TAB_DEFS } from '../tab-bar-config';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

type TabButtonProps = TabTriggerSlotProps & {
  symbol: (typeof TAB_DEFS)[number]['symbol'];
};

export function TabButton({ children, isFocused, symbol, ...props }: TabButtonProps) {
  const theme = useTheme();
  // アクティブはブランド基調色、非アクティブは補助テキスト色。テーマ（ライト/ダーク）に追従する。
  const tintColor = isFocused ? theme.primary : theme.textSecondary;

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.tabButtonInner, isFocused && { borderColor: theme.primary }]}>
        <SymbolView tintColor={tintColor} name={symbol} size={22} />
        <ThemedText
          type="small"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={[styles.tabLabel, isFocused && styles.tabLabelFocused, { color: tintColor }]}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}
