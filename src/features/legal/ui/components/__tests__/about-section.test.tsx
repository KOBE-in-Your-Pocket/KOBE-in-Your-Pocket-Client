import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Text as MockText } from 'react-native';

import { SUPPORT_CONTACT_URL } from '../../../domain/support-contact';
import { AboutSection } from '../about-section';

import type { ReactNode } from 'react';

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockGetAppVersion = jest.fn();

jest.mock('../../../infrastructure/app-version', () => ({
  getAppVersion: () => mockGetAppVersion(),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ backgroundElement: '#eeeeee', textSecondary: '#666666' }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue(undefined),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
}));

describe('AboutSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppVersion.mockReturnValue('1.0.0');
  });

  it('プライバシーポリシーを表示言語の URL で開く', () => {
    render(<AboutSection />);

    fireEvent.press(screen.getByLabelText('settings.privacyPolicy'));

    expect(openBrowserAsync).toHaveBeenCalledWith(
      'https://kobe-in-your-pocket.github.io/privacy/ja/',
      expect.anything(),
    );
  });

  it('クレジット画面へ遷移できる', () => {
    render(<AboutSection />);

    fireEvent.press(screen.getByLabelText('settings.credits'));

    expect(router.push).toHaveBeenCalledWith('/settings/credits');
  });

  it('問い合わせ窓口を開く（Guideline 1.2 の連絡手段）', () => {
    render(<AboutSection />);

    fireEvent.press(screen.getByLabelText('settings.contact'));

    expect(openBrowserAsync).toHaveBeenCalledWith(SUPPORT_CONTACT_URL, expect.anything());
  });

  it('バージョンを表示する', () => {
    render(<AboutSection />);

    expect(screen.getByText('1.0.0')).toBeTruthy();
  });

  it('バージョンを取得できない環境では行ごと出さない', () => {
    mockGetAppVersion.mockReturnValue(null);

    render(<AboutSection />);

    expect(screen.queryByText('settings.version')).toBeNull();
  });
});
