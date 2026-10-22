import { Linking } from 'react-native';

import { buildTelUrl, openPhoneCall } from '../open-phone-call';

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
});
