import '@testing-library/jest-native/extend-expect';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text as MockText } from 'react-native';

import type { PublicUser } from '../../../domain/public-user';
import { AccountSection } from '../account-section';

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

jest.mock('../../../application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser,
}));

jest.mock('../../../application/use-sign-out', () => ({
  useSignOut: () => mockSignOut,
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
});
