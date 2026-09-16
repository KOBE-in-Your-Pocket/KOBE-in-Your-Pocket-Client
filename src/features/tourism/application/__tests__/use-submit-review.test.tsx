import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useAuthStore } from '@/features/user';

import { postReview } from '../../infrastructure/api/review-api';
import { useReviewStore } from '../../store/use-review-store';
import { useSubmitReview } from '../use-submit-review';
import { SPOT_REVIEWS_QUERY_KEY } from '../use-spot-reviews';

import type { PropsWithChildren } from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ja' } }),
}));

jest.mock('../../infrastructure/api/review-api', () => ({
  postReview: jest.fn(),
}));

// user の公開 API（@/features/user）は SettingsScreen 経由で shared/ui バレル
// （Reanimated / react-native-maps 等のネイティブ UI）を巻き込む。このテストは
// 認証ストアだけ必要なので、重い UI バレルはスタブして読み込みを避ける。
jest.mock('@/shared/ui', () => ({
  ThemedText: () => null,
  ThemedView: () => null,
}));

// 同じく公開 API が AccountEditScreen 経由で expo-router を巻き込むためスタブする。
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}));

const postReviewMock = postReview as jest.Mock;

const AUTHOR = { id: 'user-arakawa', name: '荒川蓮', iconUrl: 'https://i.pravatar.cc/150?img=68' };

const CREATED_REVIEW = {
  id: 'review-from-server',
  rating: { value: 4 },
  comment: '景色がきれいで素晴らしかったです！また行きたいです。',
  author: AUTHOR,
  postedAt: '2026-09-04T00:00:00Z',
  language: 'ja' as const,
};

/**
 * gcTime を 0 にするのは、キャッシュ回収のタイマーがテスト終了後も残って
 * jest がプロセスを終了できなくなるのを防ぐため。
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useSubmitReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useReviewStore.setState({ submittedReviews: {} });
    useAuthStore.getState().logout();
  });

  it('現在ユーザーと表示言語を添えて backend へ投稿する', async () => {
    useAuthStore.getState().login(AUTHOR);
    postReviewMock.mockResolvedValue(CREATED_REVIEW);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubmitReview('spot-a'), { wrapper });

    result.current.mutate({ rating: { value: 4 }, comment: CREATED_REVIEW.comment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postReviewMock).toHaveBeenCalledWith(
      'spot-a',
      { rating: { value: 4 }, comment: CREATED_REVIEW.comment, language: 'ja' },
      AUTHOR,
    );
  });

  it('投稿に成功したらサーバー採番のレビューをストアへ積む', async () => {
    useAuthStore.getState().login(AUTHOR);
    postReviewMock.mockResolvedValue(CREATED_REVIEW);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubmitReview('spot-a'), { wrapper });

    result.current.mutate({ rating: { value: 4 }, comment: CREATED_REVIEW.comment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useReviewStore.getState().submittedReviews['spot-a']).toEqual([CREATED_REVIEW]);
  });

  it('投稿に成功したら該当スポットのレビュー一覧を無効化する', async () => {
    useAuthStore.getState().login(AUTHOR);
    postReviewMock.mockResolvedValue(CREATED_REVIEW);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useSubmitReview('spot-a'), { wrapper });

    result.current.mutate({ rating: { value: 4 }, comment: CREATED_REVIEW.comment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: [...SPOT_REVIEWS_QUERY_KEY, 'spot-a'],
    });
  });

  it('投稿に失敗したらストアに積まずエラーになる', async () => {
    useAuthStore.getState().login(AUTHOR);
    postReviewMock.mockRejectedValue(new Error('network down'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubmitReview('spot-a'), { wrapper });

    result.current.mutate({ rating: { value: 4 }, comment: 'ネットワークが落ちている場合。' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useReviewStore.getState().submittedReviews['spot-a']).toBeUndefined();
  });

  it('未ログイン時は投稿せずエラーになる', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSubmitReview('spot-a'), { wrapper });

    result.current.mutate({ rating: { value: 4 }, comment: '未ログインなので投稿されないはず。' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(postReviewMock).not.toHaveBeenCalled();
    expect(useReviewStore.getState().submittedReviews['spot-a']).toBeUndefined();
  });
});
