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

  it.each(['(078) 331 8181', '+81-78-331-8181', '（078）331－8181', '078ー331ー8181'])(
    '表示用の区切りだけの番号（%p）は発信できる',
    (phoneNumber) => {
      expect(getPhoneNumberIssue(phoneNumber)).toBeNull();
    },
  );

  it.each([
    '078-331-8181,123',
    '078-331-8181/078-331-8182',
    '078-331-8181;078-331-8182',
    '078-331-8181（内線123）',
    '078-331-8181 ext.123',
    '078+331',
  ])('内線・複数番号など区切り以外を含む（%p）なら unsupportedFormat', (phoneNumber) => {
    expect(getPhoneNumberIssue(phoneNumber)).toBe('unsupportedFormat');
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
  let openURLSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    openURLSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('tel: URL で OS の電話アプリを開き、true を返す', async () => {
    await expect(openPhoneCall('078-331-8181')).resolves.toBe(true);

    expect(openURLSpy).toHaveBeenCalledWith('tel:0783318181');
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it.each([
    ['未設定', 'noDigits'],
    ['078-331-8181/078-331-8182', 'unsupportedFormat'],
  ])(
    '発信できない番号（%p）では電話アプリを開かず、原因（%s）をログに残して false を返す',
    async (phoneNumber, issue) => {
      await expect(openPhoneCall(phoneNumber)).resolves.toBe(false);

      expect(openURLSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[phone-call] 発信できない電話番号のため電話アプリを開きませんでした:',
        { phoneNumber, issue },
      );
    },
  );

  it('電話アプリを開けなかったら reject せず、原因をログに残して false を返す', async () => {
    const error = new Error('unsupported');
    openURLSpy.mockRejectedValueOnce(error);

    await expect(openPhoneCall('078-331-8181')).resolves.toBe(false);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[phone-call] 電話アプリを開けませんでした:',
      error,
    );
  });
});
