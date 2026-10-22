import type { TFunction } from 'i18next';
import { Alert } from 'react-native';

import { openPhoneCall } from '@/shared/lib/phone-call';

/** OS の電話アプリで発信する。開けなかったらエラーダイアログを出す（原因のログは `openPhoneCall` が残す）。 */
export function callPhone(t: TFunction, phoneNumber: string): void {
  void openPhoneCall(phoneNumber).then((opened) => {
    if (!opened) {
      Alert.alert(t('phoneCall.errorTitle'), t('phoneCall.errorMessage'));
    }
  });
}
