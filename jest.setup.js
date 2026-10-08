// AsyncStorage はネイティブモジュールに依存するため、テストでは公式提供のモックへ差し替える。
// https://react-native-async-storage.github.io/async-storage/docs/advanced/jest
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// expo-secure-store もネイティブモジュールのため、テストではモックへ差し替える。
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Apple サインインのネイティブモジュールをモックへ差し替える。
// 既定はキャンセル（ERR_REQUEST_CANCELED）。成功パスは各テストで signInAsync の戻り値を上書きする。
jest.mock('expo-apple-authentication', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  const AppleAuthenticationButton = ({ onPress, ...rest }) =>
    React.createElement(
      Pressable,
      { accessibilityRole: 'button', onPress, ...rest },
      React.createElement(Text, null, 'Apple Sign-In'),
    );

  return {
    AppleAuthenticationButton,
    AppleAuthenticationButtonType: { SIGN_IN: 0, CONTINUE: 1, SIGN_UP: 2 },
    AppleAuthenticationButtonStyle: { WHITE: 0, WHITE_OUTLINE: 1, BLACK: 2 },
    AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
    isAvailableAsync: jest.fn().mockResolvedValue(false),
    signInAsync: jest
      .fn()
      .mockRejectedValue(Object.assign(new Error('canceled'), { code: 'ERR_REQUEST_CANCELED' })),
  };
});

// expo-crypto もネイティブモジュールのため、決定的な値を返すモックへ差し替える。
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  randomUUID: jest.fn(() => 'raw-nonce'),
  digestStringAsync: jest.fn(async (_algorithm, value) => `hashed:${value}`),
}));

// Google サインインのネイティブモジュールをモックへ差し替える。
// 既定はキャンセル応答。成功パスは各テストで signIn の戻り値を上書きする。
jest.mock('@react-native-google-signin/google-signin', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  const GoogleSigninButton = ({ onPress, disabled, ...rest }) =>
    React.createElement(
      Pressable,
      { accessibilityRole: 'button', onPress, disabled, ...rest },
      React.createElement(Text, null, 'Google Sign-In'),
    );
  GoogleSigninButton.Size = { Icon: 0, Standard: 1, Wide: 2 };
  GoogleSigninButton.Color = { Dark: 'dark', Light: 'light' };

  return {
    GoogleSignin: {
      configure: jest.fn(),
      hasPlayServices: jest.fn().mockResolvedValue(true),
      signIn: jest.fn().mockResolvedValue({ type: 'cancelled' }),
      signOut: jest.fn().mockResolvedValue(null),
    },
    GoogleSigninButton,
    isSuccessResponse: (response) => response?.type === 'success',
    isCancelledResponse: (response) => response?.type === 'cancelled',
    isErrorWithCode: (error) => typeof error?.code !== 'undefined',
    statusCodes: {},
  };
});
