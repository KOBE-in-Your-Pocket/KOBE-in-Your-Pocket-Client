import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Linking, StyleSheet } from 'react-native';

import { PhoneCallConfirmDialog } from '../phone-call-confirm-dialog';
import { CALL_BUTTON_COLOR } from '../styles/phone-call-confirm-dialog.styles';

const PHONE_NUMBER = '078-331-8181';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { phoneNumber?: string }) =>
      options?.phoneNumber ? `${key}:${options.phoneNumber}` : key,
  }),
}));

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const openURLSpy = jest.spyOn(Linking, 'openURL');

function renderDialog(phoneNumber: string | null = PHONE_NUMBER) {
  const onClose = jest.fn();
  render(<PhoneCallConfirmDialog phoneNumber={phoneNumber} onClose={onClose} />);
  return { onClose };
}

describe('PhoneCallConfirmDialog', () => {
  beforeEach(() => {
    alertSpy.mockClear();
    openURLSpy.mockReset().mockResolvedValue(true);
  });

  it('番号を含む確認文だけを表示し、この時点では発信しない', () => {
    renderDialog();

    expect(screen.getByText(`phoneCall.confirmMessage:${PHONE_NUMBER}`)).toBeTruthy();
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('phoneNumber が null のときは表示しない', () => {
    renderDialog(null);

    expect(screen.queryByText(/phoneCall\.confirmMessage/)).toBeNull();
    expect(screen.queryByLabelText('phoneCall.confirm')).toBeNull();
  });

  it('「発信する」ボタンだけを青で表示する', () => {
    renderDialog();

    const callStyle = StyleSheet.flatten(screen.getByLabelText('phoneCall.confirm').props.style);
    const cancelStyle = StyleSheet.flatten(screen.getByLabelText('phoneCall.cancel').props.style);

    expect(callStyle.backgroundColor).toBe(CALL_BUTTON_COLOR);
    expect(cancelStyle.backgroundColor).not.toBe(CALL_BUTTON_COLOR);
  });

  it('「発信する」を選ぶとダイアログを閉じ、tel: URL で電話アプリを起動する', async () => {
    const { onClose } = renderDialog();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('phoneCall.confirm'));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(openURLSpy).toHaveBeenCalledWith('tel:0783318181');
  });

  it('「キャンセル」を選ぶとダイアログを閉じるだけで発信しない', () => {
    const { onClose } = renderDialog();

    fireEvent.press(screen.getByLabelText('phoneCall.cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('電話アプリを開けなかったらエラーダイアログを表示する', async () => {
    openURLSpy.mockRejectedValueOnce(new Error('unsupported'));
    renderDialog();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('phoneCall.confirm'));
    });

    expect(alertSpy).toHaveBeenCalledWith('phoneCall.errorTitle', 'phoneCall.errorMessage');
  });
});
