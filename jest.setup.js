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
