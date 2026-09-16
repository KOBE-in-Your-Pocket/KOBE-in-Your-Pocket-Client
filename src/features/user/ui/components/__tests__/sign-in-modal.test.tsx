import '@testing-library/jest-native/extend-expect';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { AuthApiError } from '../../../domain/auth-api-error';
import type { AuthSession } from '../../../domain/auth-session';
import { SignInModal } from '../sign-in-modal';

import type { ReactNode } from 'react';

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/lib/theme', () => ({
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

let mockGoogleSignIn: MutationMock;
let mockEmailSignIn: MutationMock;
let mockEmailSignUp: MutationMock;

// エラー種別の変換ロジック（resolveEmail*ErrorKind）は実物を使い、フックだけ差し替える。
jest.mock('../../../application/use-email-auth', () => ({
  ...jest.requireActual('../../../application/use-email-auth'),
  useEmailSignIn: () => mockEmailSignIn,
  useEmailSignUp: () => mockEmailSignUp,
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

function fillSignInForm() {
  fireEvent.changeText(screen.getByPlaceholderText('auth.emailPlaceholder'), 'taro@example.com');
  fireEvent.changeText(screen.getByPlaceholderText('auth.passwordPlaceholder'), 'password123');
}

function switchToSignUpAndFill() {
  fireEvent.press(screen.getByText('auth.signUpTab'));
  fireEvent.changeText(screen.getByPlaceholderText('auth.namePlaceholder'), 'メール 太郎');
  fillSignInForm();
}

describe('SignInModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGoogleSignIn = createMutationMock();
    mockEmailSignIn = createMutationMock();
    mockEmailSignUp = createMutationMock();
  });

  it('メールログイン成功でモーダルを閉じる', () => {
    mockEmailSignIn.mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.(SESSION);
    });

    render(<SignInModal visible onClose={onClose} />);
    fillSignInForm();
    fireEvent.press(screen.getByText('auth.submitSignIn'));

    expect(mockEmailSignIn.mutate).toHaveBeenCalledWith(
      { email: 'taro@example.com', password: 'password123' },
      expect.anything(),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('認証情報誤り（400）は invalidCredentials の文言を表示する', () => {
    mockEmailSignIn.isError = true;
    mockEmailSignIn.error = new AuthApiError(400, 'Invalid login credentials');

    render(<SignInModal visible onClose={onClose} />);

    expect(screen.getByText('auth.invalidCredentials')).toBeOnTheScreen();
  });

  it('メール未確認（email_not_confirmed）は専用の文言を表示する', () => {
    mockEmailSignIn.isError = true;
    mockEmailSignIn.error = new AuthApiError(
      400,
      '{"code":400,"error_code":"email_not_confirmed","msg":"Email not confirmed"}',
    );

    render(<SignInModal visible onClose={onClose} />);

    expect(screen.getByText('auth.emailNotConfirmed')).toBeOnTheScreen();
  });

  it('新規登録がメール確認待ちの場合は案内を表示してモーダルを閉じない', () => {
    mockEmailSignUp.mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.({ status: 'confirmationRequired' });
    });

    render(<SignInModal visible onClose={onClose} />);
    switchToSignUpAndFill();
    fireEvent.press(screen.getByText('auth.submitSignUp'));

    expect(mockEmailSignUp.mutate).toHaveBeenCalledWith(
      { email: 'taro@example.com', password: 'password123', name: 'メール 太郎' },
      expect.anything(),
    );
    expect(screen.getByText('auth.confirmationEmailSent')).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('新規登録でセッションが発行されたらモーダルを閉じる', () => {
    mockEmailSignUp.mutate.mockImplementation((_input, options) => {
      options?.onSuccess?.({ status: 'session', session: SESSION });
    });

    render(<SignInModal visible onClose={onClose} />);
    switchToSignUpAndFill();
    fireEvent.press(screen.getByText('auth.submitSignUp'));

    expect(onClose).toHaveBeenCalled();
  });

  it('新規登録のレート制限（429）は emailRateLimited の文言を表示する', () => {
    mockEmailSignUp.isError = true;
    mockEmailSignUp.error = new AuthApiError(429, 'email rate limit exceeded');

    render(<SignInModal visible onClose={onClose} />);
    fireEvent.press(screen.getByText('auth.signUpTab'));

    expect(screen.getByText('auth.emailRateLimited')).toBeOnTheScreen();
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

  it('Google サインイン開始時にメール認証のエラー状態をリセットする', () => {
    render(<SignInModal visible onClose={onClose} />);
    fireEvent.press(screen.getByText('Google Sign-In'));

    expect(mockEmailSignIn.reset).toHaveBeenCalled();
    expect(mockEmailSignUp.reset).toHaveBeenCalled();
  });

  it('メール認証開始時に Google のエラー状態をリセットする', () => {
    render(<SignInModal visible onClose={onClose} />);
    fillSignInForm();
    fireEvent.press(screen.getByText('auth.submitSignIn'));

    expect(mockGoogleSignIn.reset).toHaveBeenCalled();
  });

  it('入力が不足している間は送信できない', () => {
    render(<SignInModal visible onClose={onClose} />);

    fireEvent.press(screen.getByText('auth.submitSignIn'));
    expect(mockEmailSignIn.mutate).not.toHaveBeenCalled();

    // 新規登録はパスワード 6 文字未満だと送信不可。
    fireEvent.press(screen.getByText('auth.signUpTab'));
    fireEvent.changeText(screen.getByPlaceholderText('auth.namePlaceholder'), 'メール 太郎');
    fireEvent.changeText(screen.getByPlaceholderText('auth.emailPlaceholder'), 'taro@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('auth.passwordPlaceholder'), 'short');
    fireEvent.press(screen.getByText('auth.submitSignUp'));
    expect(mockEmailSignUp.mutate).not.toHaveBeenCalled();
  });

  it('pending 中は送信も入力もできない', () => {
    mockEmailSignIn.isPending = true;

    render(<SignInModal visible onClose={onClose} />);
    fillSignInForm();
    fireEvent.press(screen.getByText('auth.submitSignIn'));

    expect(mockEmailSignIn.mutate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('auth.emailPlaceholder')).toBeDisabled();
  });
});
