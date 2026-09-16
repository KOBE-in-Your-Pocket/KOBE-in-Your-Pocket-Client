import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useAuthStore } from '@/features/user';

import { updateReview } from '../../infrastructure/api/review-api';
import { useReviewStore } from '../../store/use-review-store';
import { SPOT_REVIEWS_QUERY_KEY } from '../use-spot-reviews';
import { useUpdateReview } from '../use-update-review';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/review-api', () => ({
  updateReview: jest.fn(),
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

const updateReviewMock = updateReview as jest.Mock;

const AUTHOR = { id: 'user-arakawa', name: '荒川蓮', iconUrl: 'https://i.pravatar.cc/150?img=68' };

const EXISTING_REVIEW = {
  id: 'review-1',
  rating: { value: 3 },
  comment: '編集前のコメント',
  author: AUTHOR,
  postedAt: '2026-09-01T00:00:00Z',
  language: 'ja' as const,
};

const UPDATED_REVIEW = {
  ...EXISTING_REVIEW,
  rating: { value: 5 },
  comment: '編集後のコメント',
};

const CHANGES = { rating: { value: 5 }, comment: '編集後のコメント' };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useUpdateReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useReviewStore.setState({ submittedReviews: { 'spot-a': [EXISTING_REVIEW] } });
    useAuthStore.getState().logout();
  });

  it('現在ユーザーを添えて backend の更新 API を呼ぶ', async () => {
    useAuthStore.getState().login(AUTHOR);
    updateReviewMock.mockResolvedValue(UPDATED_REVIEW);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-1', changes: CHANGES });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateReviewMock).toHaveBeenCalledWith('spot-a', 'review-1', CHANGES, AUTHOR);
  });

  it('更新に成功したらローカルストアの同 ID のレビューも書き換える', async () => {
    useAuthStore.getState().login(AUTHOR);
    updateReviewMock.mockResolvedValue(UPDATED_REVIEW);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-1', changes: CHANGES });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useReviewStore.getState().submittedReviews['spot-a']).toEqual([UPDATED_REVIEW]);
  });

  it('更新に成功したら該当スポットのレビュー一覧を無効化する', async () => {
    useAuthStore.getState().login(AUTHOR);
    updateReviewMock.mockResolvedValue(UPDATED_REVIEW);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-1', changes: CHANGES });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, 'spot-a'] });
  });

  it('更新に失敗したらローカルストアを書き換えずエラーになる', async () => {
    useAuthStore.getState().login(AUTHOR);
    updateReviewMock.mockRejectedValue(new Error('network down'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-1', changes: CHANGES });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useReviewStore.getState().submittedReviews['spot-a']).toEqual([EXISTING_REVIEW]);
  });

  it('未ログイン時は更新せずエラーになる', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-1', changes: CHANGES });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(updateReviewMock).not.toHaveBeenCalled();
  });
});
