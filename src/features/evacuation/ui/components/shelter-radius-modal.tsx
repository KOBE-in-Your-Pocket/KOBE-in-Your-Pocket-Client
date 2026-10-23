import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { styles } from '../styles/shelter-radius-modal.styles';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

/**
 * 避難所マップの表示半径を設定するモーダル。マップ画面右上のハンバーガーメニューから開く。
 *
 * 枠組みのみ（#675）。半径選択UIは #676 で追加する。
 */
export function ShelterRadiusModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* 暗幕のタップで閉じる。シート内のタップは下の Pressable が吸収して閉じないようにする。 */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}}>
          <ThemedView type="background" style={styles.sheet}>
            <View style={[styles.headerRow, { paddingTop: insets.top + Spacing.three }]}>
              <ThemedText type="subtitle">{t('evacuation.radiusFilter.title')}</ThemedText>
              <Pressable
                style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('evacuation.radiusFilter.close')}
              >
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={16}
                />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content} />
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
