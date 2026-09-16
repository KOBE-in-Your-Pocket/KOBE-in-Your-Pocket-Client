import { useTranslation } from 'react-i18next';
import { Linking, Modal, Pressable, View } from 'react-native';

import { ThemedText } from '../../themed/themed-text';
import { ThemedView } from '../../themed/themed-view';

import { styles } from './styles/location-services-modal.styles';

export type LocationServicesModalProps = {
  /** モーダルの表示有無。 */
  visible: boolean;
  /** 閉じる操作（「閉じる」押下・背面タップ・端末の戻る操作）時のコールバック。 */
  onClose: () => void;
};

/**
 * 端末の位置情報サービスがオフになったことを知らせ、設定アプリへ誘導するモーダル。
 * 「設定を開く」で端末設定（位置情報の変更）へ遷移する。
 */
export function LocationServicesModal({ visible, onClose }: LocationServicesModalProps) {
  const { t } = useTranslation();

  const handleOpenSettings = () => {
    // 端末の設定アプリを開き、ユーザーが位置情報をオンに切り替えられるようにする。
    void Linking.openSettings();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ThemedView type="background" style={styles.card}>
          <ThemedText type="subtitle" style={styles.title}>
            {t('location.servicesDisabledTitle')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
            {t('location.servicesDisabledMessage')}
          </ThemedText>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.button, styles.secondaryButton]}
              accessibilityRole="button"
              accessibilityLabel={t('location.close')}
            >
              <ThemedText style={styles.secondaryButtonText}>{t('location.close')}</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleOpenSettings}
              style={[styles.button, styles.primaryButton]}
              accessibilityRole="button"
              accessibilityLabel={t('location.openSettings')}
            >
              <ThemedText style={styles.primaryButtonText}>{t('location.openSettings')}</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}
