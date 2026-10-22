import { act, renderHook } from '@testing-library/react-native';

import { useShelterPhoneCall } from '../use-shelter-phone-call';

describe('useShelterPhoneCall', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('発信できる番号なら発信確認ダイアログの発信先にセットする', () => {
    const { result } = renderHook(() =>
      useShelterPhoneCall({ id: 'shelter-1', phoneNumber: '078-411-0556' }),
    );

    act(() => result.current.requestCall());

    expect(result.current.callTarget).toBe('078-411-0556');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('閉じると発信先を null に戻す', () => {
    const { result } = renderHook(() =>
      useShelterPhoneCall({ id: 'shelter-1', phoneNumber: '078-411-0556' }),
    );

    act(() => result.current.requestCall());
    act(() => result.current.closeCall());

    expect(result.current.callTarget).toBeNull();
  });

  it.each([
    [undefined, 'missing'],
    ['   ', 'missing'],
    ['未設定', 'noDigits'],
  ] as const)(
    '発信できない番号（%p）ならダイアログを出さずにキャンセルし、原因（%s）をログに残す',
    (phoneNumber, issue) => {
      const { result } = renderHook(() => useShelterPhoneCall({ id: 'shelter-1', phoneNumber }));

      act(() => result.current.requestCall());

      expect(result.current.callTarget).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[evacuation] 発信できない電話番号のため発信をキャンセルしました:',
        { shelterId: 'shelter-1', phoneNumber, issue },
      );
    },
  );
});
