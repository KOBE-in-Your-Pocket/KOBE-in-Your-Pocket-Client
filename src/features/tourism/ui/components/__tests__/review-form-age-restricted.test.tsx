import { render, screen } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { ReviewForm } from '../review-form';

import { useAgeRestrictionStore } from '@/shared/store';

import type { ReactNode } from 'react';

// 投稿機能が解禁された後（v1.1）でも 18歳未満には出さないことを確認する。
// そのためフラグ自体は ON にしておく。
jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  IS_USER_CONTENT_ENABLED: true,
}));

jest.mock('../../../application/use-submit-review', () => ({
  useSubmitReview: () => ({ isPending: false, mutate: jest.fn(), reset: jest.fn() }),
}));

jest.mock('@/features/user/application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ backgroundElement: '#F0F0F3' }),
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockCurrentUser = jest.fn();

describe('ReviewForm（18歳未満）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAgeRestrictionStore.setState({ isAdult: false });
  });

  it('未ログイン時に投稿導線もログイン案内も表示しない', () => {
    // ログインを促してしまうとアカウント作成へ誘導することになるため、案内も出さない。
    mockCurrentUser.mockReturnValue(null);

    render(<ReviewForm spotId="spot-1" />);

    expect(screen.queryByLabelText('tourism.reviewForm.placeholder')).toBeNull();
    expect(screen.queryByText('tourism.reviewForm.loginRequired')).toBeNull();
  });

  it('ログイン済みでも投稿導線を表示しない', () => {
    mockCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'テスト太郎',
      iconUrl: 'https://example.com/icon.png',
    });

    render(<ReviewForm spotId="spot-1" />);

    expect(screen.queryByLabelText('tourism.reviewForm.placeholder')).toBeNull();
  });

  it('成人なら投稿導線を表示する', () => {
    // 制限が「年齢によるもの」であって、フォームが壊れているわけではないことを示す。
    useAgeRestrictionStore.setState({ isAdult: true });
    mockCurrentUser.mockReturnValue({
      id: 'user-1',
      name: 'テスト太郎',
      iconUrl: 'https://example.com/icon.png',
    });

    render(<ReviewForm spotId="spot-1" />);

    expect(screen.getByLabelText('tourism.reviewForm.placeholder')).toBeTruthy();
  });
});
