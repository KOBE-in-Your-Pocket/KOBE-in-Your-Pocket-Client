import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { deleteReview } from '../../infrastructure/api/review-api';
import { useReviewStore } from '../../store/use-review-store';
import { useDeleteReview } from '../use-delete-review';
import { SPOTS_QUERY_KEY } from '../use-spots';
import { SPOT_REVIEWS_QUERY_KEY } from '../use-spot-reviews';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/review-api', () => ({
  deleteReview: jest.fn(),
}));

const deleteReviewMock = deleteReview as jest.Mock;

const AUTHOR = { id: 'user-arakawa', name: '荒川蓮', iconUrl: 'https://i.pravatar.cc/150?img=68' };

const EXISTING_REVIEW = {
  id: 'review-1',
  rating: { value: 3 },
  comment: '削除対象のコメント',
  author: AUTHOR,
  postedAt: '2026-09-01T00:00:00Z',
  language: 'ja' as const,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useDeleteReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useReviewStore.setState({ submittedReviews: { 'spot-a': [EXISTING_REVIEW] } });
  });

  it('backend の削除 API を呼ぶ', async () => {
    deleteReviewMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteReview('spot-a'), { wrapper });

    result.current.mutate('review-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteReviewMock).toHaveBeenCalledWith('spot-a', 'review-1');
  });

  it('削除に成功したらローカルストアから同 ID のレビューを除去する', async () => {
    deleteReviewMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteReview('spot-a'), { wrapper });

    result.current.mutate('review-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useReviewStore.getState().submittedReviews['spot-a']).toEqual([]);
  });

  it('削除に成功したら該当スポットのレビュー一覧を無効化する', async () => {
    deleteReviewMock.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteReview('spot-a'), { wrapper });

    result.current.mutate('review-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: [...SPOT_REVIEWS_QUERY_KEY, 'spot-a'] });
  });

  it('削除に成功したらスポットの評価・件数表示が更新されるようクエリを無効化する', async () => {
    deleteReviewMock.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteReview('spot-a'), { wrapper });

    result.current.mutate('review-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: SPOTS_QUERY_KEY });
  });

  it('削除に失敗したらローカルストアを書き換えずエラーになる', async () => {
    deleteReviewMock.mockRejectedValue(new Error('network down'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteReview('spot-a'), { wrapper });

    result.current.mutate('review-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useReviewStore.getState().submittedReviews['spot-a']).toEqual([EXISTING_REVIEW]);
  });
});
