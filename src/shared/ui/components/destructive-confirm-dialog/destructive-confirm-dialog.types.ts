export type DestructiveConfirmDialogProps = {
  /** ダイアログの表示有無。 */
  visible: boolean;
  /** タイトル。 */
  title: string;
  /** 本文。 */
  message: string;
  /** キャンセルボタンの文言。 */
  cancelLabel: string;
  /** 実行ボタンの文言。破壊的操作の色（赤）で表示する。 */
  confirmLabel: string;
  /** 実行ボタン押下時のコールバック。呼び出し側で `visible` を false に戻す。 */
  onConfirm: () => void;
  /** キャンセル・背面タップ・戻る操作時のコールバック。呼び出し側で `visible` を false に戻す。 */
  onCancel: () => void;
};
