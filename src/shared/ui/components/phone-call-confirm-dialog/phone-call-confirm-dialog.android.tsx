import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, useColorScheme, View } from 'react-native';

import { callPhone } from './call-phone';
import { ANDROID_ALERT_COLORS, styles } from './styles/phone-call-confirm-dialog.styles';

import type { PhoneCallConfirmDialogProps } from './phone-call-confirm-dialog.types';

/**
 * 電話発信前の確認ダイアログ（Android）。「発信する」で OS の電話アプリを起動する。
 *
 * React Native の `Alert` は Android でタイトルだけを渡しても本文欄の空白が大きく残るため、
 * 経路案内の確認（`confirmOpenDirections`）と同じ見た目の AlertDialog を `Modal` で再現する。
 * ボタンは OS 標準どおり、キャンセル・発信ともアクセントカラーで表示する。
 */
export function PhoneCallConfirmDialog({ phoneNumber, onClose }: PhoneCallConfirmDialogProps) {
  const { t } = useTranslation();
  // OS 標準の AlertDialog（DayNight）と同じく、端末のダークモードに追従する。
  const colors = ANDROID_ALERT_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const handleCall = () => {
    if (!phoneNumber) return;
    onClose();
    callPhone(t, phoneNumber);
  };

  return (
    <Modal visible={phoneNumber !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        {/* カード内のタップが背面の「閉じる」に伝播しないよう Pressable で受け止める。 */}
        <Pressable accessible={false} style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('phoneCall.confirmMessage', { phoneNumber: phoneNumber ?? '' })}
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={t('phoneCall.cancel')}
            >
              <Text style={[styles.buttonText, { color: colors.button }]}>
                {t('phoneCall.cancel')}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCall}
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel={t('phoneCall.confirm')}
            >
              <Text style={[styles.buttonText, { color: colors.button }]}>
                {t('phoneCall.confirm')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
