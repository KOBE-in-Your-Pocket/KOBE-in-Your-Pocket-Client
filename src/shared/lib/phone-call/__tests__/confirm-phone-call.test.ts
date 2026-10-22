import type { TFunction } from 'i18next';
import { act } from 'react';
import { Alert, Linking, type AlertButton } from 'react-native';

import { confirmPhoneCall } from '../confirm-phone-call';
import { buildTelUrl } from '../open-phone-call';

const PHONE_NUMBER = '078-331-8181';

const t = ((key: string) => key) as unknown as TFunction;

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const openURLSpy = jest.spyOn(Linking, 'openURL');

/** 最初に表示された確認ダイアログから、指定ラベルのボタンを取り出す。 */
function findDialogButton(text: string): AlertButton | undefined {
  const buttons = (alertSpy.mock.calls[0]?.[2] ?? []) as AlertButton[];
  return buttons.find((button) => button.text === text);
}

describe('buildTelUrl', () => {
  it('ハイフン区切りの番号を数字だけの tel: URL にする', () => {
    expect(buildTelUrl('078-331-8181')).toBe('tel:0783318181');
  });

  it('空白や括弧も取り除く', () => {
    expect(buildTelUrl(' (078) 331 8181 ')).toBe('tel:0783318181');
  });

  it('国際番号の先頭 + は残す', () => {
    expect(buildTelUrl('+81-78-331-8181')).toBe('tel:+81783318181');
  });
});

describe('confirmPhoneCall', () => {
  beforeEach(() => {
    alertSpy.mockClear();
    openURLSpy.mockReset().mockResolvedValue(true);
  });

  it('発信前に確認ダイアログを表示し、この時点では発信しない', () => {
    confirmPhoneCall(t, PHONE_NUMBER);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]?.[0]).toBe('phoneCall.confirmMessage');
    expect(alertSpy.mock.calls[0]?.[1]).toBeUndefined();
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('「発信する」を選ぶと tel: URL で電話アプリを起動する', async () => {
    confirmPhoneCall(t, PHONE_NUMBER);

    await act(async () => {
      await findDialogButton('phoneCall.confirm')?.onPress?.();
    });

    expect(openURLSpy).toHaveBeenCalledWith('tel:0783318181');
  });

  it('「キャンセル」を選ぶと何も起こらない', () => {
    confirmPhoneCall(t, PHONE_NUMBER);

    const cancel = findDialogButton('phoneCall.cancel');
    expect(cancel?.style).toBe('cancel');
    cancel?.onPress?.();

    expect(openURLSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('電話アプリを開けなかったらエラーダイアログを表示する', async () => {
    openURLSpy.mockRejectedValueOnce(new Error('unsupported'));
    confirmPhoneCall(t, PHONE_NUMBER);

    await act(async () => {
      await findDialogButton('phoneCall.confirm')?.onPress?.();
    });

    expect(alertSpy).toHaveBeenLastCalledWith('phoneCall.errorTitle', 'phoneCall.errorMessage');
  });
});
