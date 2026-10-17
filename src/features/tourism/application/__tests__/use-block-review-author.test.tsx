import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { blockReviewAuthor } from '../../infrastructure/api/review-api';
import { useBlockedAuthorStore } from '../../store/use-blocked-author-store';
import { useBlockReviewAuthor } from '../use-block-review-author';
import { SPOT_REVIEWS_QUERY_KEY } from '../use-spot-reviews';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/review-api', () => ({
  blockReviewAuthor: jest.fn(),
}));

jest.mock('@/features/user/application/use-current-user', () => ({
  useCurrentUser: () => mockCurrentUser(),
}));

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockCurrentUser = jest.fn();
const blockReviewAuthorMock = blockReviewAuthor as jest.Mock;

const BLOCKER = { id: 'user-blocker', name: 'ブロックする人', iconUrl: '' };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useBlockReviewAuthor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockReturnValue(BLOCKER);
    useBlockedAuthorStore.setState({ blockedAuthorIds: {} });
  });

  it('投稿者の ID でブロック API を呼び、端末にも記録して全スポットの一覧を古い扱いにする', async () => {
    blockReviewAuthorMock.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useBlockReviewAuthor(), { wrapper });

    result.current.mutate({ authorId: 'user-troll' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(blockReviewAuthorMock).toHaveBeenCalledWith('user-troll');
    expect(useBlockedAuthorStore.getState().blockedAuthorIds).toEqual({
      [BLOCKER.id]: ['user-troll'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: SPOT_REVIEWS_QUERY_KEY });
  });

  it('API が失敗したら端末に記録しない', async () => {
    blockReviewAuthorMock.mockRejectedValue(new Error('network'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBlockReviewAuthor(), { wrapper });

    result.current.mutate({ authorId: 'user-troll' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useBlockedAuthorStore.getState().blockedAuthorIds).toEqual({});
  });

  it('未ログインならブロック API を呼ばずに失敗する', async () => {
    mockCurrentUser.mockReturnValue(null);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBlockReviewAuthor(), { wrapper });

    result.current.mutate({ authorId: 'user-troll' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(blockReviewAuthorMock).not.toHaveBeenCalled();
  });
});
