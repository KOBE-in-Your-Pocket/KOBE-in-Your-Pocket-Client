import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';

import { styles } from '../styles/map-settings-button.styles';

/**
 * 地図画面右上に浮かせるハンバーガーメニューアイコン。避難所モードでのみ表示され、
 * タップで避難所の表示半径を設定するモーダル（{@link ShelterRadiusModal}）を開く。
 */
export function MapSettingsButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[
        styles.container,
        styles.button,
        { top: insets.top + Spacing.three, backgroundColor: theme.backgroundElement },
      ]}
      hitSlop={8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('map.settings.open')}
    >
      <SymbolView
        tintColor={theme.text}
        name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }}
        size={20}
      />
    </Pressable>
  );
}
