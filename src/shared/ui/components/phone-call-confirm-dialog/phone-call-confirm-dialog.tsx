import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, View } from 'react-native';

import { ThemedText } from '../../themed/themed-text';
import { ThemedView } from '../../themed/themed-view';

import { styles } from './styles/phone-call-confirm-dialog.styles';

import { openPhoneCall } from '@/shared/lib/phone-call';
import { useTheme } from '@/shared/lib/theme';

export type PhoneCallConfirmDialogProps = {
  /** 発信先の電話番号。`null` のときはダイアログを表示しない。 */
  phoneNumber: string | null;
  /** 閉じる操作（キャンセル・発信・背面タップ・端末の戻る操作）時のコールバック。呼び出し側で `phoneNumber` を `null` に戻す。 */
  onClose: () => void;
};

/**
 * 電話発信前の確認ダイアログ。「発信する」で OS の電話アプリを起動する。
 *
 * `Alert` は iOS / Android ともボタンごとの色を指定できないため、
 * 「発信する」だけを青く表示できるよう `Modal` で自前に描画する。
 */
export function PhoneCallConfirmDialog({ phoneNumber, onClose }: PhoneCallConfirmDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleCall = () => {
    if (!phoneNumber) return;
    onClose();
    openPhoneCall(phoneNumber).catch(() => {
      Alert.alert(t('phoneCall.errorTitle'), t('phoneCall.errorMessage'));
    });
  };

  return (
    <Modal visible={phoneNumber !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        {/* カード内のタップが背面の「閉じる」に伝播しないよう Pressable で受け止める。 */}
        <Pressable accessible={false}>
          <ThemedView type="background" style={styles.card}>
            <ThemedText style={styles.title}>
              {t('phoneCall.confirmMessage', { phoneNumber: phoneNumber ?? '' })}
            </ThemedText>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}
                accessibilityRole="button"
                accessibilityLabel={t('phoneCall.cancel')}
              >
                <ThemedText style={styles.cancelButtonText}>{t('phoneCall.cancel')}</ThemedText>
              </Pressable>

              <Pressable
                onPress={handleCall}
                style={[styles.button, styles.callButton]}
                accessibilityRole="button"
                accessibilityLabel={t('phoneCall.confirm')}
              >
                <ThemedText style={styles.callButtonText}>{t('phoneCall.confirm')}</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
