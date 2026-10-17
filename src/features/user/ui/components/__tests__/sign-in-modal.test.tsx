import '@testing-library/jest-native/extend-expect';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import type { AuthSession } from '../../../domain/auth-session';
import { SignInModal } from '../sign-in-modal';

import type { ReactNode } from 'react';

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/lib/theme', () => ({
  useColorScheme: () => 'light',
  useTheme: () => ({
    background: '#ffffff',
    backgroundElement: '#eeeeee',
    text: '#000000',
    textSecondary: '#666666',
  }),
}));

// @/shared/ui バレルは Reanimated 等を巻き込むため軽量スタブへ差し替える。
jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

/** useMutation 互換の最小モック。テストごとに挙動を上書きする。 */
type MutationMock = {
  mutate: jest.Mock;
  reset: jest.Mock;
  isPending: boolean;
  isError: boolean;
  error: unknown;
};

const createMutationMock = (): MutationMock => ({
  mutate: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  isError: false,
  error: null,
});

let mockAppleSignIn: MutationMock;
let mockAppleSignInAvailable: boolean;
let mockGoogleSignIn: MutationMock;

// 表示条件（iOS かつ isAvailableAsync）の判定はフック側のテストで確認する。
jest.mock('../../../application/use-apple-sign-in', () => ({
  useAppleSignIn: () => mockAppleSignIn,
  useIsAppleSignInAvailable: () => mockAppleSignInAvailable,
}));

jest.mock('../../../application/use-google-sign-in', () => ({
  useGoogleSignIn: () => mockGoogleSignIn,
}));

const SESSION: AuthSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  tokenType: 'bearer',
  user: { id: 'user-1', name: 'メール 太郎', iconUrl: '' },
};

describe('SignInModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppleSignIn = createMutationMock();
    mockAppleSignInAvailable = true;
    mockGoogleSignIn = createMutationMock();
  });

  it('Google サインイン成功でモーダルを閉じ、キャンセル（null）では閉じない', () => {
    mockGoogleSignIn.mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.(null);
    });

    render(<SignInModal visible onClose={onClose} />);
    fireEvent.press(screen.getByText('Google Sign-In'));
    expect(onClose).not.toHaveBeenCalled();

    mockGoogleSignIn.mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.(SESSION);
    });
    fireEvent.press(screen.getByText('Google Sign-In'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Apple サインインを提供できない端末ではボタンを出さない', () => {
    mockAppleSignInAvailable = false;

    render(<SignInModal visible onClose={onClose} />);

    expect(screen.queryByText('Sign in with Apple')).toBeNull();
    expect(screen.getByText('Google Sign-In')).toBeOnTheScreen();
  });

  it('Apple サインイン成功でモーダルを閉じ、キャンセル（null）では閉じない', () => {
    mockAppleSignIn.mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.(null);
    });

    render(<SignInModal visible onClose={onClose} />);
    fireEvent.press(screen.getByText('Sign in with Apple'));
    expect(mockAppleSignIn.mutate).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    mockAppleSignIn.mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.(SESSION);
    });
    fireEvent.press(screen.getByText('Sign in with Apple'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Apple サインイン失敗時はエラー文言を表示する', () => {
    mockAppleSignIn.isError = true;

    render(<SignInModal visible onClose={onClose} />);

    expect(screen.getByText('settings.signInError')).toBeOnTheScreen();
  });

  it('Apple サインイン開始時に他の方法のエラー状態をリセットする', () => {
    render(<SignInModal visible onClose={onClose} />);
    fireEvent.press(screen.getByText('Sign in with Apple'));

    expect(mockGoogleSignIn.reset).toHaveBeenCalled();
  });

  it('pending 中は Apple サインインを開始しない', () => {
    mockGoogleSignIn.isPending = true;

    render(<SignInModal visible onClose={onClose} />);
    fireEvent.press(screen.getByText('Sign in with Apple'));

    expect(mockAppleSignIn.mutate).not.toHaveBeenCalled();
  });

  it('メールアドレス + パスワードの入力欄は表示しない', () => {
    render(<SignInModal visible onClose={onClose} />);

    expect(screen.queryByPlaceholderText('auth.emailPlaceholder')).toBeNull();
    expect(screen.queryByPlaceholderText('auth.passwordPlaceholder')).toBeNull();
    expect(screen.queryByText('auth.signUpTab')).toBeNull();
  });
});
