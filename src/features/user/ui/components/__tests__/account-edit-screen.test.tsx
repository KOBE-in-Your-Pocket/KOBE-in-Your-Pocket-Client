import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text as MockText, View as MockView } from 'react-native';

import { useAuthStore } from '../../../store/use-auth-store';
import { AccountEditScreen } from '../account-edit-screen';

import type { ReactNode } from 'react';
import type { PickProfileIconResult } from '../../../application/pick-profile-icon';

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

const mockUpdateCurrentUser = jest.fn();
const mockUploadMyIcon = jest.fn();
jest.mock('../../../infrastructure/api/user-api', () => ({
  ...jest.requireActual('../../../infrastructure/api/user-api'),
  updateCurrentUser: (request: { name?: string }) => mockUpdateCurrentUser(request),
  uploadMyIcon: (localUri: string) => mockUploadMyIcon(localUri),
}));

const mockPickProfileIcon = jest.fn<Promise<PickProfileIconResult>, []>();
jest.mock('../../../application/pick-profile-icon', () => ({
  pickProfileIcon: () => mockPickProfileIcon(),
}));

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const USER = { id: 'user-1', name: 'Google 太郎', iconUrl: 'https://i.pravatar.cc/150?img=12' };
const NEW_ICON_URI = 'file:///tmp/new-icon.jpg';
const UPLOADED_ICON_URL = 'https://media.example.com/icons/icon-1.jpg';

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AccountEditScreen />
    </QueryClientProvider>,
  );
}

async function pressChangeIcon() {
  fireEvent.press(screen.getByLabelText('settings.accountEdit.changeIcon'));
  await waitFor(() => expect(mockPickProfileIcon).toHaveBeenCalled());
}

describe('AccountEditScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateCurrentUser.mockImplementation(async (request: { name?: string }) => ({
      id: USER.id,
      name: request.name ?? USER.name,
      iconUrl: USER.iconUrl,
    }));
    mockUploadMyIcon.mockResolvedValue({
      id: USER.id,
      name: USER.name,
      iconUrl: UPLOADED_ICON_URL,
    });
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

  it('表示名を編集して保存するとストアへ反映され前の画面へ戻る', async () => {
    renderScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('settings.accountEdit.displayNamePlaceholder'),
      '新しい名前',
    );
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(useAuthStore.getState().currentUser?.name).toBe('新しい名前');
    expect(mockUploadMyIcon).not.toHaveBeenCalled();
  });

  it('アイコンを選んで保存すると画像がアップロードされ、応答の URL が反映される', async () => {
    mockPickProfileIcon.mockResolvedValue({ status: 'picked', uri: NEW_ICON_URI });
    renderScreen();

    await pressChangeIcon();
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(mockUploadMyIcon).toHaveBeenCalledWith(NEW_ICON_URI);
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe(UPLOADED_ICON_URL);
  });

  it('一度写真を選んだ後に選び直しが失敗したら、前に選んだ写真を使わず保存する', async () => {
    mockPickProfileIcon.mockResolvedValueOnce({ status: 'picked', uri: NEW_ICON_URI });
    renderScreen();
    fireEvent.press(screen.getByLabelText('settings.accountEdit.changeIcon'));
    await waitFor(() => expect(mockPickProfileIcon).toHaveBeenCalledTimes(1));

    mockPickProfileIcon.mockRejectedValueOnce(new Error('picker failed'));
    fireEvent.press(screen.getByLabelText('settings.accountEdit.changeIcon'));
    await waitFor(() => expect(mockPickProfileIcon).toHaveBeenCalledTimes(2));

    expect(screen.getByText('settings.accountEdit.iconPickError')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(mockUploadMyIcon).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe(USER.iconUrl);
  });

  it('写真の選択に失敗したらエラー文を表示し、アップロードを呼ばない', async () => {
    mockPickProfileIcon.mockRejectedValue(new Error('picker failed'));
    renderScreen();

    await pressChangeIcon();

    expect(screen.getByText('settings.accountEdit.iconPickError')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(mockUploadMyIcon).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe(USER.iconUrl);
  });

  it('写真を選ばずに閉じた（キャンセル）場合は何も変えず、アップロードを呼ばない', async () => {
    mockPickProfileIcon.mockResolvedValue({ status: 'canceled' });
    renderScreen();

    await pressChangeIcon();

    expect(screen.queryByText('settings.accountEdit.iconPickError')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(mockUploadMyIcon).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe(USER.iconUrl);
  });

  it('写真の選択・加工中は保存ボタンが押せない', async () => {
    mockPickProfileIcon.mockReturnValue(new Promise<PickProfileIconResult>(() => {}));
    renderScreen();

    fireEvent.press(screen.getByLabelText('settings.accountEdit.changeIcon'));
    await waitFor(() => expect(mockPickProfileIcon).toHaveBeenCalled());

    expect(screen.getByRole('button', { name: 'settings.accountEdit.save' })).toBeDisabled();
  });

  it('保存に失敗したらエラー文を表示し、画面を閉じず入力内容を残す', async () => {
    mockUpdateCurrentUser.mockRejectedValue(new Error('network error'));
    renderScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('settings.accountEdit.displayNamePlaceholder'),
      '新しい名前',
    );
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(screen.getByText('settings.accountEdit.saveError')).toBeTruthy());
    expect(router.back).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('新しい名前')).toBeTruthy();
    expect(useAuthStore.getState().currentUser?.name).toBe(USER.name);
  });

  it('アイコンのアップロードに失敗したらエラー文を表示し、アイコンを差し替えない', async () => {
    mockPickProfileIcon.mockResolvedValue({ status: 'picked', uri: NEW_ICON_URI });
    mockUploadMyIcon.mockRejectedValue(new Error('upload failed'));
    renderScreen();

    await pressChangeIcon();
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(screen.getByText('settings.accountEdit.saveError')).toBeTruthy());
    expect(router.back).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser?.iconUrl).toBe(USER.iconUrl);
  });

  it('失敗後に表示名を書き換えるとエラー文が消える', async () => {
    mockUpdateCurrentUser.mockRejectedValue(new Error('network error'));
    renderScreen();
    const nameInput = () =>
      screen.getByPlaceholderText('settings.accountEdit.displayNamePlaceholder');

    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));
    await waitFor(() => expect(screen.getByText('settings.accountEdit.saveError')).toBeTruthy());

    fireEvent.changeText(nameInput(), '書き換えた名前');
    expect(screen.queryByText('settings.accountEdit.saveError')).toBeNull();
  });

  it('保存中は保存中の表示になり、保存ボタンは押せない', async () => {
    mockUpdateCurrentUser.mockReturnValue(new Promise(() => {}));
    renderScreen();

    fireEvent.changeText(
      screen.getByPlaceholderText('settings.accountEdit.displayNamePlaceholder'),
      '新しい名前',
    );
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(screen.getByText('settings.accountEdit.saving')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'settings.accountEdit.save' })).toBeDisabled();
    expect(mockUpdateCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('保存中は表示名を編集できない', async () => {
    mockUpdateCurrentUser.mockReturnValue(new Promise(() => {}));
    renderScreen();
    const nameInput = () =>
      screen.getByPlaceholderText('settings.accountEdit.displayNamePlaceholder');

    fireEvent.changeText(nameInput(), '新しい名前');
    fireEvent.press(screen.getByRole('button', { name: 'settings.accountEdit.save' }));

    await waitFor(() => expect(screen.getByText('settings.accountEdit.saving')).toBeTruthy());
    expect(nameInput().props.editable).toBe(false);
  });
});
