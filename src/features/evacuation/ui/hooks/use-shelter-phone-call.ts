import { useCallback, useState } from 'react';

import { getPhoneNumberIssue } from '@/shared/lib/phone-call';

import type { EvacuationShelter } from '../../domain/evacuation-shelter';

/**
 * 避難所の電話番号への発信リクエストと、発信確認ダイアログの開閉状態を扱う。
 *
 * 発信できない番号（未登録・数字を含まない・内線や複数番号の表記）のときは利用者には何も出さずにキャンセルし、
 * どの避難所でなぜ失敗したかをログに残して原因を追えるようにする。
 */
export function useShelterPhoneCall({
  id,
  phoneNumber,
}: Pick<EvacuationShelter, 'id' | 'phoneNumber'>) {
  // 発信確認ダイアログの発信先。null のときはダイアログを閉じている。
  const [callTarget, setCallTarget] = useState<string | null>(null);

  const requestCall = useCallback(() => {
    const issue = getPhoneNumberIssue(phoneNumber);
    if (issue !== null || !phoneNumber) {
      console.warn('[evacuation] 発信できない電話番号のため発信をキャンセルしました:', {
        shelterId: id,
        phoneNumber,
        issue,
      });
      return;
    }
    setCallTarget(phoneNumber);
  }, [id, phoneNumber]);

  const closeCall = useCallback(() => setCallTarget(null), []);

  return { callTarget, requestCall, closeCall };
}
