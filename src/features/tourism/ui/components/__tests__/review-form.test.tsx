import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text as MockText, View as MockView } from 'react-native';

import { useAuthStore } from '@/features/user';

import { postReview } from '../../../infrastructure/api/review-api';
import { ReviewForm } from '../review-form';

import { useAgeRestrictionStore } from '@/shared/store';

import type { ReactNode } from 'react';

jest.mock('../../../infrastructure/api/review-api', () => ({
  postReview: jest.fn(),
}));

const postReviewMock = postReview as jest.Mock;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
  // 投稿機能そのものの挙動を検証するため、v1 で OFF のフラグを ON にして描画する。
  // OFF のときに何も出さないことは *-user-content-disabled.test.tsx で検証する。
  IS_USER_CONTENT_ENABLED: true,
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

// user の公開 API 経由で読み込む shared/ui バレルは Reanimated / react-native-maps
// などネイティブ UI を含む。このテストでは描画のみ必要なので軽量スタブへ差し替える。
jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
  ThemedView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

// user の公開 API が AccountEditScreen 経由で expo-router を巻き込むためスタブする。
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const USER = { id: 'user-arakawa', name: '荒川蓮', iconUrl: 'https://i.pravatar.cc/150?img=68' };
const OTHER_USER = {
  id: 'user-yamada',
  name: '山田花子',
  iconUrl: 'https://example.com/hanako.png',
};
/**
 * 投稿は Promise の解決とその後の再レンダーを挟む。CI の遅いランナーでは
 * waitFor の既定（1 秒）で足りずに落ちるため、明示的に長めを渡す。
 */
const ASYNC_TIMEOUT = { timeout: 10_000 };

const PLACEHOLDER_LABEL = 'tourism.reviewForm.placeholder';
const COMMENT_PLACEHOLDER = 'tourism.reviewForm.commentPlaceholder';
const SUBMIT_LABEL = 'tourism.reviewForm.submit';
const SUBMITTING_LABEL = 'tourism.reviewForm.submitting';
const SUBMIT_ERROR = 'tourism.reviewForm.submitError';

const CREATED_REVIEW = {
  id: 'review-from-server',
  rating: { value: 4 },
  comment: '投稿するコメント',
  author: USER,
  postedAt: '2026-09-04T00:00:00Z',
  language: 'ja' as const,
};

/**
 * gcTime を 0 にするのは、キャッシュ回収のタイマーがテスト終了後も残って
 * jest がプロセスを終了できなくなるのを防ぐため。
 */
function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ReviewForm spotId="spot-a" />
    </QueryClientProvider>,
  );
}

/**
 * 展開してから星とコメントを埋め、投稿できる状態にする。
 * t のスタブが翻訳キーをそのまま返すため 5 つの星は同じラベルになる。4 つ目を押す。
 */
function fillForm(comment = '投稿するコメント') {
  fireEvent.press(screen.getByLabelText(PLACEHOLDER_LABEL));
  fireEvent.press(screen.getAllByLabelText('tourism.reviewForm.starLabel')[3]);
  fireEvent.changeText(screen.getByPlaceholderText(COMMENT_PLACEHOLDER), comment);
}

describe('ReviewForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().logout();
    // 投稿フォームそのものの挙動を検証するため成人として描画する。
    // 18歳未満で何も出さないことは review-form-age-restricted.test.tsx で検証する。
    useAgeRestrictionStore.setState({ isAdult: true });
  });

  it('未ログイン時はログイン案内を表示する', () => {
    renderForm();

    expect(screen.queryByLabelText(PLACEHOLDER_LABEL)).toBeNull();
    expect(screen.getByText('tourism.reviewForm.loginRequired')).toBeTruthy();
  });

  it('ログアウトで下書きを破棄し、再ログイン時に入力が残らない', () => {
    act(() => {
      useAuthStore.getState().login(USER);
    });
    renderForm();

    // 展開して下書きを入力する
    fireEvent.press(screen.getByLabelText(PLACEHOLDER_LABEL));
    fireEvent.changeText(screen.getByPlaceholderText(COMMENT_PLACEHOLDER), '書きかけの下書き');
    expect(screen.getByPlaceholderText(COMMENT_PLACEHOLDER).props.value).toBe('書きかけの下書き');

    // ログアウト → フォーム非表示
    act(() => {
      useAuthStore.getState().logout();
    });
    expect(screen.queryByPlaceholderText(COMMENT_PLACEHOLDER)).toBeNull();
    expect(screen.queryByLabelText(PLACEHOLDER_LABEL)).toBeNull();

    // 再ログイン → 折りたたみ状態で復帰し、下書きは消えている
    act(() => {
      useAuthStore.getState().login(USER);
    });
    expect(screen.getByLabelText(PLACEHOLDER_LABEL)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(PLACEHOLDER_LABEL));
    expect(screen.getByPlaceholderText(COMMENT_PLACEHOLDER).props.value).toBe('');
  });

  it('別ユーザーへ切り替わった際も下書きを持ち越さない（logout を挟まない切替）', () => {
    act(() => {
      useAuthStore.getState().login(USER);
    });
    renderForm();

    // USER で下書きを入力する
    fireEvent.press(screen.getByLabelText(PLACEHOLDER_LABEL));
    fireEvent.changeText(screen.getByPlaceholderText(COMMENT_PLACEHOLDER), '前のユーザーの下書き');
    expect(screen.getByPlaceholderText(COMMENT_PLACEHOLDER).props.value).toBe(
      '前のユーザーの下書き',
    );

    // logout を挟まず別ユーザーへ切り替え → 折りたたみに戻り下書きは消えている
    act(() => {
      useAuthStore.getState().login(OTHER_USER);
    });
    expect(screen.queryByPlaceholderText(COMMENT_PLACEHOLDER)).toBeNull();
    fireEvent.press(screen.getByLabelText(PLACEHOLDER_LABEL));
    expect(screen.getByPlaceholderText(COMMENT_PLACEHOLDER).props.value).toBe('');
  });

  it('投稿に成功したらフォームを閉じて入力をクリアする', async () => {
    act(() => {
      useAuthStore.getState().login(USER);
    });
    postReviewMock.mockResolvedValue(CREATED_REVIEW);
    renderForm();

    fillForm();
    fireEvent.press(screen.getByText(SUBMIT_LABEL));

    await waitFor(() => expect(postReviewMock).toHaveBeenCalledTimes(1), ASYNC_TIMEOUT);
    await waitFor(
      () => expect(screen.queryByPlaceholderText(COMMENT_PLACEHOLDER)).toBeNull(),
      ASYNC_TIMEOUT,
    );

    // 再展開しても下書きは残っていない
    fireEvent.press(screen.getByLabelText(PLACEHOLDER_LABEL));
    expect(screen.getByPlaceholderText(COMMENT_PLACEHOLDER).props.value).toBe('');
  });

  it('投稿に失敗したらエラーを表示し、入力内容を保持する', async () => {
    act(() => {
      useAuthStore.getState().login(USER);
    });
    postReviewMock.mockRejectedValue(new Error('network down'));
    renderForm();

    fillForm('失敗しても消えないコメント');
    fireEvent.press(screen.getByText(SUBMIT_LABEL));

    await waitFor(() => expect(screen.getByText(SUBMIT_ERROR)).toBeTruthy(), ASYNC_TIMEOUT);
    expect(screen.getByPlaceholderText(COMMENT_PLACEHOLDER).props.value).toBe(
      '失敗しても消えないコメント',
    );
  });

  it('投稿中は送信ボタンのラベルを切り替え、二重送信を防ぐ', async () => {
    act(() => {
      useAuthStore.getState().login(USER);
    });
    let resolvePost: (review: typeof CREATED_REVIEW) => void = () => {};
    postReviewMock.mockReturnValue(
      new Promise((resolve) => {
        resolvePost = resolve;
      }),
    );
    renderForm();

    fillForm();
    fireEvent.press(screen.getByText(SUBMIT_LABEL));

    await waitFor(() => expect(screen.getByText(SUBMITTING_LABEL)).toBeTruthy(), ASYNC_TIMEOUT);
    fireEvent.press(screen.getByText(SUBMITTING_LABEL));
    expect(postReviewMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePost(CREATED_REVIEW);
    });
  });
});
