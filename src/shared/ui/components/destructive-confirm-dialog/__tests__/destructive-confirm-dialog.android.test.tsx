import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable as MockPressable, Text as MockText, View as MockView } from 'react-native';

import { DestructiveConfirmDialog } from '../destructive-confirm-dialog.android';

import type { ReactNode } from 'react';

// Jetpack Compose のネイティブビューは Jest 上で描画できないため、構造と props だけ再現する。
jest.mock('@expo/ui', () => ({
  Host: ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('@expo/ui/jetpack-compose', () => {
  const Slot = ({ children }: { children: ReactNode }) => <MockView>{children}</MockView>;
  const AlertDialog = ({
    children,
    onDismissRequest,
  }: {
    children: ReactNode;
    onDismissRequest?: () => void;
  }) => (
    <MockView testID="alert-dialog">
      <MockPressable testID="dismiss-request" onPress={onDismissRequest} />
      {children}
    </MockView>
  );
  AlertDialog.Title = Slot;
  AlertDialog.Text = Slot;
  AlertDialog.ConfirmButton = Slot;
  AlertDialog.DismissButton = Slot;
  return {
    AlertDialog,
    Text: ({ children, color }: { children: ReactNode; color?: string }) => (
      <MockText testID={color ? `text-color-${color}` : undefined}>{children}</MockText>
    ),
    TextButton: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
      <MockPressable accessibilityRole="button" onPress={onClick}>
        {children}
      </MockPressable>
    ),
  };
});

describe('DestructiveConfirmDialog（Android）', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('非表示のときは何も描画しない', () => {
    renderDialog(false);

    expect(screen.queryByTestId('alert-dialog')).toBeNull();
  });

  it('タイトル・本文・ボタンを表示し、実行ボタンの文字を赤にする', () => {
    renderDialog(true);

    expect(screen.getByText('タイトル')).toBeTruthy();
    expect(screen.getByText('本文')).toBeTruthy();
    expect(screen.getByText('キャンセル')).toBeTruthy();
    expect(screen.getByTestId('text-color-#FF3B30')).toHaveTextContent('削除');
  });

  it('実行ボタンでは onConfirm だけを呼ぶ', () => {
    renderDialog(true);

    fireEvent.press(screen.getByText('削除'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('キャンセルボタンでは onCancel を呼び、削除しない', () => {
    renderDialog(true);

    fireEvent.press(screen.getByText('キャンセル'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('背面タップ・戻る操作（onDismissRequest）では onCancel を呼び、削除しない', () => {
    renderDialog(true);

    fireEvent.press(screen.getByTestId('dismiss-request'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
