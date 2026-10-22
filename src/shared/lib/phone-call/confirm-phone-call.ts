import type { TFunction } from 'i18next';
import { Alert } from 'react-native';

import { openPhoneCall } from './open-phone-call';

/** 電話発信前の確認ダイアログを表示し、承認時に OS の電話アプリで発信する。 */
export function confirmPhoneCall(t: TFunction, phoneNumber: string): void {
  // タイトルは置かず「{番号} に発信しますか？」の一文だけを見出しとして表示する。
  Alert.alert(t('phoneCall.confirmMessage', { phoneNumber }), undefined, [
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
