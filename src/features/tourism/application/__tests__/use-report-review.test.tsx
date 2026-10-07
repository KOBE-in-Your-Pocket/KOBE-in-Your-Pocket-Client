import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { reportReview } from '../../infrastructure/api/review-api';
import { useReportReview } from '../use-report-review';

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

  return { wrapper };
}

describe('useReportReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockReturnValue(REPORTER);
  });

  it('ログイン中は backend の通報 API を reviewId 付きで呼ぶ', async () => {
    reportReviewMock.mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate('review-2');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(reportReviewMock).toHaveBeenCalledWith('spot-a', 'review-2');
  });

  it('未ログイン時は通報せずエラーで終了する', async () => {
    mockCurrentUser.mockReturnValue(null);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate('review-2');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(reportReviewMock).not.toHaveBeenCalled();
  });

  it('通報に失敗したらエラーになる', async () => {
    reportReviewMock.mockRejectedValue(new Error('network down'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReportReview('spot-a'), { wrapper });

    result.current.mutate('review-2');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
