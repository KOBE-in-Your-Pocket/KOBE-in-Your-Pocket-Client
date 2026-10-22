import type { TFunction } from 'i18next';
import { Alert } from 'react-native';

import { openPhoneCall } from './open-phone-call';

/** 電話発信前の確認ダイアログを表示し、承認時に OS の電話アプリで発信する。 */
export function confirmPhoneCall(t: TFunction, phoneNumber: string): void {
  Alert.alert(t('phoneCall.confirmTitle'), t('phoneCall.confirmMessage', { phoneNumber }), [
    { text: t('phoneCall.cancel'), style: 'cancel' },
    {
      text: t('phoneCall.confirm'),
      onPress: () => {
        openPhoneCall(phoneNumber).catch(() => {
          Alert.alert(t('phoneCall.errorTitle'), t('phoneCall.errorMessage'));
        });
      },
    },
  ]);
}
