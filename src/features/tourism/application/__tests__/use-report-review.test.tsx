import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { ApiError } from '@/shared/lib/api';

import { reportReview } from '../../infrastructure/api/review-api';
import { useReportedReviewStore } from '../../store/use-reported-review-store';
import { useReportReview } from '../use-report-review';
import { SPOT_REVIEWS_QUERY_KEY } from '../use-spot-reviews';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/review-api', () => ({
  reportReview: jest.fn(),
}));

jest.mock('@/features/user/application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockCurrentUser = jest.fn();
const reportReviewMock = reportReview as jest.Mock;

const REPORTER = { id: 'user-reporter', name: '通報者', iconUrl: '' };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useReportReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockReturnValue(REPORTER);
    useReportedReviewStore.setState({ reportedReviewIds: {} });
  });

  it('reviewId と理由・説明を渡して通報 API を呼ぶ', async () => {
    reportReviewMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-2', reason: 'OTHER', description: '説明' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('reported');
    expect(reportReviewMock).toHaveBeenCalledWith('spot-a', 'review-2', {
      reason: 'OTHER',
      description: '説明',
    });
    expect(useReportedReviewStore.getState().reportedReviewIds).toEqual({
      [REPORTER.id]: ['review-2'],
    });
  });

  it('409（通報済み）は成功扱いにする', async () => {
    reportReviewMock.mockRejectedValue(new ApiError(409, 'Conflict', 'already reported'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-2', reason: 'SPAM', description: '' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useReportedReviewStore.getState().reportedReviewIds[REPORTER.id]).toEqual(['review-2']);
  });

  it('404（レビュー削除済み）は notFound として隠し、一覧を再取得させる', async () => {
    reportReviewMock.mockRejectedValue(new ApiError(404, 'Not Found', 'review not found'));
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-2', reason: 'SPAM', description: '' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('notFound');
    expect(useReportedReviewStore.getState().reportedReviewIds[REPORTER.id]).toEqual(['review-2']);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...SPOT_REVIEWS_QUERY_KEY, 'spot-a'],
    });
  });

  it('未ログインなら通報せずエラーになる', async () => {
    mockCurrentUser.mockReturnValue(null);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-2', reason: 'SPAM', description: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(reportReviewMock).not.toHaveBeenCalled();
  });

  it('それ以外の失敗はエラーになる', async () => {
    reportReviewMock.mockRejectedValue(new ApiError(500, 'Internal Server Error', 'boom'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate({ reviewId: 'review-2', reason: 'SPAM', description: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useReportedReviewStore.getState().reportedReviewIds).toEqual({});
  });
});
