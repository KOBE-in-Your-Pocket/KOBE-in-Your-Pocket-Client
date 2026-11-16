import { fireEvent, render, screen } from '@testing-library/react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { Text as MockText, View as MockView } from 'react-native';

import { CreditsScreen } from '../credits-screen';

import type { ReactNode } from 'react';

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
let mockLanguage = 'ja';

jest.mock('@/shared/config', () => ({
  MaxContentWidth: 800,
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ backgroundElement: '#eeeeee', textSecondary: '#666666' }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: mockLanguage } }),
}));

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(() => true), replace: jest.fn() },
}));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue(undefined),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
}));

const YAHOO_URL = 'https://developer.yahoo.co.jp/sitemap/';

describe('CreditsScreen', () => {
  beforeEach(() => {
    mockLanguage = 'ja';
    jest.clearAllMocks();
  });

  it('日本語では「Webサービス by Yahoo! JAPAN」を出し、押すと Yahoo! のページを開く', () => {
    render(<CreditsScreen />);

    expect(screen.getByText('legal.credits.weather')).toBeTruthy();
    fireEvent.press(screen.getByRole('link', { name: 'Webサービス by Yahoo! JAPAN' }));

    expect(openBrowserAsync).toHaveBeenCalledWith(YAHOO_URL, expect.anything());
  });

  it('日本語以外では「Web Services by Yahoo! JAPAN」を出す', () => {
    mockLanguage = 'en';
    render(<CreditsScreen />);

    expect(screen.getByRole('link', { name: 'Web Services by Yahoo! JAPAN' })).toBeTruthy();
  });

  it('Yahoo! のクレジットは画面の一番下に置く（クレジット配置ルール）', () => {
    render(<CreditsScreen />);

    const links = screen.getAllByRole('link');
    expect(links.at(-1)).toBe(screen.getByRole('link', { name: 'Webサービス by Yahoo! JAPAN' }));
  });
});
