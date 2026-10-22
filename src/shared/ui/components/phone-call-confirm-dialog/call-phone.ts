import type { TFunction } from 'i18next';
import { Alert } from 'react-native';

import { openPhoneCall } from '@/shared/lib/phone-call';

/** OS の電話アプリで発信する。開けなかったら原因をログに残し、エラーダイアログを出す。 */
export function callPhone(t: TFunction, phoneNumber: string): void {
  openPhoneCall(phoneNumber).catch((error: unknown) => {
    console.error('[phone-call] 電話アプリを開けませんでした:', error);
    Alert.alert(t('phoneCall.errorTitle'), t('phoneCall.errorMessage'));
  });
}
