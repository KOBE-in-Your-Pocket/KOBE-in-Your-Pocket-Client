import { Platform } from 'react-native';

import { resolveGoogleSignInConfig } from '../use-google-sign-in';

describe('resolveGoogleSignInConfig', () => {
  const originalIos = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const originalWeb = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const originalPlatformOs = Platform.OS;

  afterEach(() => {
    if (originalIos === undefined) {
      delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    } else {
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = originalIos;
    }

    if (originalWeb === undefined) {
      delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    } else {
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = originalWeb;
    }

    (Platform as { OS: string }).OS = originalPlatformOs;
  });

  it('iOS では iosClientId を返す', () => {
    (Platform as { OS: string }).OS = 'ios';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'ios-client.apps.googleusercontent.com';

    expect(resolveGoogleSignInConfig()).toEqual({
      iosClientId: 'ios-client.apps.googleusercontent.com',
    });
  });

  it('iOS で Client ID 未設定ならエラーを投げる', () => {
    (Platform as { OS: string }).OS = 'ios';
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

    expect(() => resolveGoogleSignInConfig()).toThrow(/EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID/);
  });

  it('Android では webClientId を返す', () => {
    (Platform as { OS: string }).OS = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'web-client.apps.googleusercontent.com';

    expect(resolveGoogleSignInConfig()).toEqual({
      webClientId: 'web-client.apps.googleusercontent.com',
    });
  });

  it('Android で Web Client ID 未設定ならエラーを投げる', () => {
    (Platform as { OS: string }).OS = 'android';
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    expect(() => resolveGoogleSignInConfig()).toThrow(/EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/);
  });
});
