export type PhoneCallConfirmDialogProps = {
  /** 発信先の電話番号。`null` のときはダイアログを表示しない。 */
  phoneNumber: string | null;
  /** 閉じる操作（キャンセル・発信・端末の戻る操作など）時のコールバック。呼び出し側で `phoneNumber` を `null` に戻す。 */
  onClose: () => void;
};
