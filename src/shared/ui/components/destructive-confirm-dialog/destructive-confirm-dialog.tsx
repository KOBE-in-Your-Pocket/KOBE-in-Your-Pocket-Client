import { useEffect } from 'react';
import { Alert } from 'react-native';

import type { DestructiveConfirmDialogProps } from './destructive-confirm-dialog.types';

/**
 * 削除などの破壊的操作の確認ダイアログ（iOS / Web）。
 *
 * iOS は `Alert.alert` の `style: 'destructive'` で実行ボタンが標準の警告色になるため、
 * OS 標準のアラートをそのまま使う。Android 版は `destructive-confirm-dialog.android.tsx`（#564）。
 */
export function DestructiveConfirmDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
}: DestructiveConfirmDialogProps) {
  useEffect(() => {
    if (!visible) return;
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: onCancel },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
    // 表示に切り替わった時点で 1 回だけ出す。props の変化で Alert を出し直さない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return null;
}
