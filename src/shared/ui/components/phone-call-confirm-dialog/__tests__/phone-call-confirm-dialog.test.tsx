import { act, render } from '@testing-library/react-native';
import { Alert, Linking, type AlertButton } from 'react-native';

import { PhoneCallConfirmDialog } from '../phone-call-confirm-dialog';

const PHONE_NUMBER = '078-331-8181';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { phoneNumber?: string }) =>
      options?.phoneNumber ? `${key}:${options.phoneNumber}` : key,
  }),
}));

describe('PhoneCallConfirmDialog（iOS / Web）', () => {
  let alertSpy: jest.SpyInstance;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    openURLSpy.mockRestore();
  });

  function renderDialog(phoneNumber: string | null = PHONE_NUMBER) {
    const onClose = jest.fn();
    const utils = render(<PhoneCallConfirmDialog phoneNumber={phoneNumber} onClose={onClose} />);
    return { onClose, ...utils };
  }

  function findButton(text: string): AlertButton | undefined {
    return (alertSpy.mock.calls[0]?.[2] as AlertButton[]).find((button) => button.text === text);
  }

  it('phoneNumber が null のときは Alert を出さない', () => {
    renderDialog(null);

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('番号を含む確認文だけの Alert を出し、「発信する」を推奨ボタン（青）にする', () => {
    renderDialog();

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      `phoneCall.confirmMessage:${PHONE_NUMBER}`,
      undefined,
      expect.any(Array),
    );
    expect(findButton('phoneCall.cancel')).toEqual(expect.objectContaining({ style: 'cancel' }));
    expect(findButton('phoneCall.confirm')).toEqual(expect.objectContaining({ isPreferred: true }));
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('null → 番号に切り替わったときに Alert を出す', () => {
    const { rerender, onClose } = renderDialog(null);

    rerender(<PhoneCallConfirmDialog phoneNumber={PHONE_NUMBER} onClose={onClose} />);

    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('「発信する」を選ぶと閉じて tel: URL で電話アプリを起動する', async () => {
    const { onClose } = renderDialog();

    await act(async () => {
      findButton('phoneCall.confirm')?.onPress?.();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(openURLSpy).toHaveBeenCalledWith('tel:0783318181');
  });

  it('「キャンセル」を選ぶと閉じるだけで発信しない', () => {
    const { onClose } = renderDialog();

    findButton('phoneCall.cancel')?.onPress?.();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('電話アプリを開けなかったらエラーダイアログを表示する', async () => {
    openURLSpy.mockRejectedValueOnce(new Error('unsupported'));
    renderDialog();

    await act(async () => {
      findButton('phoneCall.confirm')?.onPress?.();
    });

    expect(alertSpy).toHaveBeenLastCalledWith('phoneCall.errorTitle', 'phoneCall.errorMessage');
  });
});
