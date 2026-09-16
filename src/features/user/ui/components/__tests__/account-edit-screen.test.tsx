import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text as MockText, View as MockView } from 'react-native';

import { useAuthStore } from '../../../store/use-auth-store';
import { AccountEditScreen } from '../account-edit-screen';

import type { ReactNode } from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#60646C',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
  }),
}));

// shared/ui バレルは Reanimated / react-native-maps などネイティブ UI を含むため軽量スタブへ差し替える。
jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const USER = { id: 'user-1', name: 'Google 太郎', iconUrl: 'https://i.pravatar.cc/150?img=12' };

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AccountEditScreen />
    </QueryClientProvider>,
  );
}

describe('AccountEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      currentUser: USER,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('未ログイン時はログイン案内を表示する', () => {
    useAuthStore.getState().logout();
    renderScreen();

    expect(screen.getByText('settings.accountEdit.notSignedIn')).toBeTruthy();
  });

  it('現在のアカウント情報（表示名）を初期表示する', () => {
    renderScreen();

    expect(screen.getByDisplayValue('Google 太郎')).toBeTruthy();
  });

  it('表示名が空のときは保存ボタンが無効になり、有効な表示名で再度有効になる', () => {
    renderScreen();
    const nameInput = () =>
      screen.getByPlaceholderText('settings.accountEdit.displayNamePlaceholder');
    const saveButton = () => screen.getByRole('button', { name: 'settings.accountEdit.save' });

    fireEvent.changeText(nameInput(), '   ');
    expect(saveButton()).toBeDisabled();
    expect(screen.getByText('settings.accountEdit.nameInvalid')).toBeTruthy();

    fireEvent.changeText(nameInput(), '新しい名前');
    expect(saveButton()).toBeEnabled();
    expect(screen.queryByText('settings.accountEdit.nameInvalid')).toBeNull();
  });

  it('アイコンをタップするとモック写真ライブラリが開き、写真を選ぶと閉じる', () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText('settings.accountEdit.changeIcon'));
    expect(screen.getByText('settings.accountEdit.iconLibraryTitle')).toBeTruthy();

    fireEvent.press(screen.getAllByLabelText('settings.accountEdit.iconLibraryPhoto')[0]);

    expect(screen.queryByText('settings.accountEdit.iconLibraryTitle')).toBeNull();
  });

  it('表示名を編集して保存するとストアへ反映され前の画面へ戻る', async () => {
    renderScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('settings.accountEdit.displayNamePlaceholder'),
      '新しい名前',
    );
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(useAuthStore.getState().currentUser?.name).toBe('新しい名前');
  });

  it('アイコンを選んで保存すると選んだ写真が反映される', async () => {
    renderScreen();

    fireEvent.press(screen.getByLabelText('settings.accountEdit.changeIcon'));
    fireEvent.press(screen.getAllByLabelText('settings.accountEdit.iconLibraryPhoto')[0]);
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(useAuthStore.getState().currentUser?.iconUrl).not.toBe(USER.iconUrl);
  });
});
