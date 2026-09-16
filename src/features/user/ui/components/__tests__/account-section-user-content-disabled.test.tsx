import { render, screen } from '@testing-library/react-native';
import { Text as MockText } from 'react-native';

import type { PublicUser } from '../../../domain/public-user';
import { AccountSection } from '../account-section';

import type { ReactNode } from 'react';

// v1（App Store 初回リリース）の状態。サインイン導線を一切出さないことを確認する。
jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  IS_USER_CONTENT_ENABLED: false,
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

jest.mock('../../../application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser,
}));

jest.mock('../../../application/use-sign-out', () => ({
  useSignOut: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../sign-in-modal', () => ({
  SignInModal: ({ visible }: { visible: boolean }) =>
    visible ? <MockText>sign-in-modal-visible</MockText> : null,
}));

let mockCurrentUser: PublicUser | null = null;

describe('AccountSection（IS_USER_CONTENT_ENABLED = false）', () => {
  it('未ログイン時はサインイン導線を表示しない', () => {
    mockCurrentUser = null;

    render(<AccountSection />);

    expect(screen.queryByText('settings.signIn')).toBeNull();
    expect(screen.queryByText('settings.account')).toBeNull();
  });

  it('セッションが残っていてもアカウント欄を表示しない', () => {
    mockCurrentUser = { id: 'user-1', name: 'テスト太郎', iconUrl: 'https://example.com/icon.png' };

    render(<AccountSection />);

    expect(screen.queryByLabelText('settings.editAccount')).toBeNull();
    expect(screen.queryByText('settings.signOut')).toBeNull();
  });
});
