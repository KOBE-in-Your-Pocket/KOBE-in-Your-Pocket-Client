import { render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { DestructiveConfirmDialog } from '../destructive-confirm-dialog';

type AlertButton = { text?: string; style?: string; onPress?: () => void };

describe('DestructiveConfirmDialog（iOS / Web）', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  function renderDialog(visible: boolean) {
    return render(
      <DestructiveConfirmDialog
        visible={visible}
        title="タイトル"
        message="本文"
        cancelLabel="キャンセル"
        confirmLabel="削除"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
  }

  function buttons(): AlertButton[] {
    return alertSpy.mock.calls[0][2] as AlertButton[];
  }

  it('非表示のときは Alert を出さない', () => {
    renderDialog(false);

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('表示すると実行ボタンを destructive にした Alert を出す', () => {
    renderDialog(true);

    expect(alertSpy).toHaveBeenCalledWith('タイトル', '本文', expect.any(Array));
    expect(buttons()).toEqual([
      expect.objectContaining({ text: 'キャンセル', style: 'cancel' }),
      expect.objectContaining({ text: '削除', style: 'destructive' }),
    ]);
  });

  it('false → true に切り替わったときに Alert を出す', () => {
    const { rerender } = renderDialog(false);

    rerender(
      <DestructiveConfirmDialog
        visible
        title="タイトル"
        message="本文"
        cancelLabel="キャンセル"
        confirmLabel="削除"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('実行ボタンで onConfirm、キャンセルで onCancel を呼ぶ', () => {
    renderDialog(true);

    buttons()[1].onPress?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    buttons()[0].onPress?.();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
