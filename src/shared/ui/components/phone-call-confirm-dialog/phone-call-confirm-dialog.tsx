import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { callPhone } from './call-phone';

import type { PhoneCallConfirmDialogProps } from './phone-call-confirm-dialog.types';

/**
 * 電話発信前の確認ダイアログ（iOS / Web）。「発信する」で OS の電話アプリを起動する。
 *
 * 経路案内の確認（`confirmOpenDirections`）と同じ OS 標準のアラートを使い、
 * 「発信する」を `isPreferred` にして iOS 26 で青いボタンとして表示する。
 * Android 版は `phone-call-confirm-dialog.android.tsx`。
 */
export function PhoneCallConfirmDialog({ phoneNumber, onClose }: PhoneCallConfirmDialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!phoneNumber) return;
    Alert.alert(t('phoneCall.confirmMessage', { phoneNumber }), undefined, [
      { text: t('phoneCall.cancel'), style: 'cancel', onPress: onClose },
      {
        text: t('phoneCall.confirm'),
        isPreferred: true,
        onPress: () => {
          onClose();
          callPhone(t, phoneNumber);
        },
      },
    ]);
    // 番号が渡された時点で 1 回だけ出す。props の変化で Alert を出し直さない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]);

  return null;
}
