import { Linking } from 'react-native';

import { buildTelUrl, getPhoneNumberIssue, openPhoneCall } from '../open-phone-call';

describe('getPhoneNumberIssue', () => {
  it('数字を含む番号なら null（発信できる）', () => {
    expect(getPhoneNumberIssue('078-331-8181')).toBeNull();
  });

  it.each([undefined, null, '', '   '])('未登録（%p）なら missing', (phoneNumber) => {
    expect(getPhoneNumberIssue(phoneNumber)).toBe('missing');
  });

  it.each(['未設定', '-', '（なし）'])('数字を含まない（%p）なら noDigits', (phoneNumber) => {
    expect(getPhoneNumberIssue(phoneNumber)).toBe('noDigits');
  });
});

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

describe('openPhoneCall', () => {
  it('tel: URL で OS の電話アプリを開く', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await openPhoneCall('078-331-8181');

    expect(openURLSpy).toHaveBeenCalledWith('tel:0783318181');
    openURLSpy.mockRestore();
  });

  it('発信できない番号では電話アプリを開かず、理由付きのエラーで reject する', async () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await expect(openPhoneCall('未設定')).rejects.toThrow('noDigits');

    expect(openURLSpy).not.toHaveBeenCalled();
    openURLSpy.mockRestore();
  });
});
