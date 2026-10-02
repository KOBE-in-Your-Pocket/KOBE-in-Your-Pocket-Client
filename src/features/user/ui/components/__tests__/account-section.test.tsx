import '@testing-library/jest-native/extend-expect';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Pressable as MockPressable, Text as MockText, View as MockView } from 'react-native';

import type { PublicUser } from '../../../domain/public-user';
import { AccountSection } from '../account-section';

import { useAgeRestrictionStore } from '@/shared/store';

import type { ReactNode } from 'react';

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  // 投稿機能そのものの挙動を検証するため、v1 で OFF のフラグを ON にして描画する。
  // OFF のときに何も出さないことは *-user-content-disabled.test.tsx で検証する。
  IS_USER_CONTENT_ENABLED: true,
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({
    background: '#ffffff',
    backgroundElement: '#eeeeee',
    backgroundSelected: '#e0e1e6',
    text: '#000000',
    textSecondary: '#666666',
  }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
  // 確認ダイアログは表示状態とボタン操作だけ再現する（Alert / Compose の描画は共通ダイアログ側のテストで検証）。
  DestructiveConfirmDialog: ({
    visible,
    title,
    message,
    cancelLabel,
    confirmLabel,
    onConfirm,
    onCancel,
  }: {
    visible: boolean;
    title: string;
    message: string;
    cancelLabel: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    visible ? (
      <MockView testID="destructive-confirm-dialog">
        <MockText>{title}</MockText>
        <MockText>{message}</MockText>
        <MockPressable testID="destructive-confirm-dialog-cancel" onPress={onCancel}>
          <MockText>{cancelLabel}</MockText>
        </MockPressable>
        <MockPressable testID="destructive-confirm-dialog-confirm" onPress={onConfirm}>
          <MockText>{confirmLabel}</MockText>
        </MockPressable>
      </MockView>
    ) : null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

let mockCurrentUser: PublicUser | null;
const mockSignOut = { mutate: jest.fn(), isPending: false };
const mockDeleteAccount = { mutate: jest.fn(), isPending: false };

jest.mock('../../../application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser,
}));

jest.mock('../../../application/use-sign-out', () => ({
  useSignOut: () => mockSignOut,
}));

jest.mock('../../../application/use-delete-account', () => ({
  useDeleteAccount: () => mockDeleteAccount,
}));

// SignInModal は重い依存（Google ボタン・認証フック）を含むため表示状態だけ検証する。
jest.mock('../sign-in-modal', () => ({
  SignInModal: ({ visible }: { visible: boolean }) =>
    visible ? <MockText>sign-in-modal-visible</MockText> : null,
}));

const USER: PublicUser = {
  id: 'user-1',
  name: 'Google 太郎',
  iconUrl: 'https://i.pravatar.cc/150?img=12',
};

describe('AccountSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = null;
    // アカウント欄そのものの挙動を検証するため成人として描画する。
    // 18歳未満で何も出さないことは account-section-age-restricted.test.tsx で検証する。
    useAgeRestrictionStore.setState({ isAdult: true });
  });

  it('未ログイン時は「ログイン / 新規登録」行を表示し、タップでモーダルを開く', () => {
    render(<AccountSection />);

    expect(screen.queryByText('sign-in-modal-visible')).toBeNull();

    fireEvent.press(screen.getByText('settings.signIn'));

    expect(screen.getByText('sign-in-modal-visible')).toBeTruthy();
  });

  it('未ログイン時は編集導線を表示しない', () => {
    render(<AccountSection />);

    expect(screen.queryByLabelText('settings.editAccount')).toBeNull();
  });

  it('ログイン済み時はアカウント行からアカウント編集画面へ遷移できる', () => {
    mockCurrentUser = USER;
    render(<AccountSection />);

    fireEvent.press(screen.getByLabelText('settings.editAccount'));

    expect(router.push).toHaveBeenCalledWith('/settings/account-edit');
  });

  it('ログイン済み時はログアウトをタップで signOut を実行する', () => {
    mockCurrentUser = USER;
    render(<AccountSection />);

    fireEvent.press(screen.getByText('settings.signOut'));

    expect(mockSignOut.mutate).toHaveBeenCalled();
  });

  it('未ログイン時は「アカウント削除（退会）」を表示しない', () => {
    render(<AccountSection />);

    expect(screen.queryByText('settings.deleteAccount')).toBeNull();
  });

  it('ログイン済み時は「アカウント削除（退会）」をタップすると確認ダイアログを表示する（表示前には出さない）', () => {
    mockCurrentUser = USER;
    render(<AccountSection />);

    expect(screen.queryByTestId('destructive-confirm-dialog')).toBeNull();

    fireEvent.press(screen.getByText('settings.deleteAccount'));

    expect(screen.getByTestId('destructive-confirm-dialog')).toBeTruthy();
    expect(screen.getByText('settings.deleteAccountConfirmTitle')).toBeTruthy();
    expect(screen.getByText('settings.deleteAccountConfirmMessage')).toBeTruthy();
    expect(screen.getByText('settings.cancel')).toBeTruthy();
    expect(screen.getByText('settings.deleteAccountConfirm')).toBeTruthy();
  });

  it('確認ダイアログをキャンセルすると閉じ、再度タップで改めて表示する', () => {
    mockCurrentUser = USER;
    render(<AccountSection />);

    fireEvent.press(screen.getByText('settings.deleteAccount'));
    fireEvent.press(screen.getByTestId('destructive-confirm-dialog-cancel'));

    expect(screen.queryByTestId('destructive-confirm-dialog')).toBeNull();

    fireEvent.press(screen.getByText('settings.deleteAccount'));

    expect(screen.getByTestId('destructive-confirm-dialog')).toBeTruthy();
  });

  it('確認ダイアログで「削除」を選ぶと退会処理を実行する', () => {
    mockCurrentUser = USER;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<AccountSection />);

    fireEvent.press(screen.getByText('settings.deleteAccount'));
    const [, , buttons] = alertSpy.mock.calls[0];
    const confirmButton = (buttons as { text?: string; onPress?: () => void }[]).find(
      (b) => b.text === 'settings.deleteAccountConfirm',
    );
    confirmButton?.onPress?.();

    expect(mockDeleteAccount.mutate).toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
