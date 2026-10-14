import { renderHook, waitFor } from '@testing-library/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { useIsAppleSignInAvailable } from '../use-apple-sign-in';

describe('useIsAppleSignInAvailable', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    jest.clearAllMocks();
  });

  function setPlatform(os: typeof Platform.OS) {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  }

  it('iOS で isAvailableAsync が true なら true を返す', async () => {
    setPlatform('ios');
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    const { result } = renderHook(() => useIsAppleSignInAvailable());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('iOS でも isAvailableAsync が false なら false を返す', async () => {
    setPlatform('ios');
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    const { result } = renderHook(() => useIsAppleSignInAvailable());

    await waitFor(() => expect(AppleAuthentication.isAvailableAsync).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });

  it.each(['android', 'web'] as const)('%s では isAvailableAsync を呼ばず false を返す', (os) => {
    setPlatform(os);

    const { result } = renderHook(() => useIsAppleSignInAvailable());

    expect(result.current).toBe(false);
    expect(AppleAuthentication.isAvailableAsync).not.toHaveBeenCalled();
  });
});
