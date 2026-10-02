import { Host } from '@expo/ui';
import { AlertDialog, Text, TextButton } from '@expo/ui/jetpack-compose';

import type { DestructiveConfirmDialogProps } from './destructive-confirm-dialog.types';

/** 破壊的操作の実行ボタンの色。設定画面の「アカウント削除（退会）」と揃える。 */
const DESTRUCTIVE_COLOR = '#FF3B30';

/**
 * 削除などの破壊的操作の確認ダイアログ（Android）。
 *
 * React Native の `Alert` は Android で `style: 'destructive'` を無視し、ボタン色も
 * 指定できないため、Jetpack Compose の `AlertDialog` で実行ボタンを赤く表示する（#564）。
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
  if (!visible) {
    return null;
  }

  return (
    <Host matchContents>
      <AlertDialog onDismissRequest={onCancel}>
        <AlertDialog.Title>
          <Text>{title}</Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <Text>{message}</Text>
        </AlertDialog.Text>
        <AlertDialog.DismissButton>
          <TextButton onClick={onCancel}>
            <Text>{cancelLabel}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
        <AlertDialog.ConfirmButton>
          <TextButton onClick={onConfirm} colors={{ contentColor: DESTRUCTIVE_COLOR }}>
            <Text color={DESTRUCTIVE_COLOR}>{confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
      </AlertDialog>
    </Host>
  );
}
