import { SymbolView } from 'expo-symbols';
import { TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';

import { styles } from '../styles/tab-button.styles';
import { TAB_BAR_COLORS, TAB_DEFS } from '../tab-bar-config';

import { ThemedText } from '@/shared/ui';

type TabButtonProps = TabTriggerSlotProps & {
  symbol: (typeof TAB_DEFS)[number]['symbol'];
};

export function TabButton({ children, isFocused, symbol, ...props }: TabButtonProps) {
  const tintColor = isFocused ? TAB_BAR_COLORS.active : TAB_BAR_COLORS.inactive;

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <View style={[styles.tabButtonInner, isFocused && styles.tabButtonInnerFocused]}>
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
