import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Linking, StyleSheet } from 'react-native';

import { PhoneCallConfirmDialog } from '../phone-call-confirm-dialog.android';
import { ANDROID_ALERT_COLORS } from '../styles/phone-call-confirm-dialog.styles';

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

/** ボタン内の文字色を取り出す。 */
function buttonTextColor(label: string) {
  return StyleSheet.flatten(screen.getByText(label).props.style).color;
}

describe('PhoneCallConfirmDialog（Android）', () => {
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

  it('キャンセル・発信とも OS 標準のボタン色（アクセントカラー）で表示する', () => {
    renderDialog();

    expect(buttonTextColor('phoneCall.confirm')).toBe(ANDROID_ALERT_COLORS.light.button);
    expect(buttonTextColor('phoneCall.cancel')).toBe(ANDROID_ALERT_COLORS.light.button);
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
