import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { MANNERS_QUERY_KEY } from '../../../application/manner-query-keys';
import { MannerRepositoryProvider } from '../../../application/manner-repository-context';
import { useMannerDetail } from '../use-manner-detail';

import type { MannerItem } from '../../../domain/manner-item';
import type { MannerRepository } from '../../../domain/manner-repository';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ja' } }),
}));

function makeManner(id: string, title: string): MannerItem {
  return {
    id,
    title,
    description: '',
    icon: 'test',
    imageKey: null,
    kind: 'manner',
    scope: 'local',
    relatedSpotIds: [],
  };
}

const DETAIL = makeManner('no-eating-while-walking', '食べ歩き禁止（詳細）');

function createStubRepository(): MannerRepository {
  return {
    findAll: jest.fn(async () => []),
    findById: jest.fn(async () => DETAIL),
  };
}

function createWrapper(repository: MannerRepository) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <MannerRepositoryProvider repository={repository}>{children}</MannerRepositoryProvider>
      </QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe('useMannerDetail', () => {
  it('解決した言語で repository.findById を呼び、結果を返す', async () => {
    const repository = createStubRepository();
    const { Wrapper } = createWrapper(repository);

    const { result } = renderHook(() => useMannerDetail('no-eating-while-walking'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(DETAIL);
    expect(repository.findById).toHaveBeenCalledWith('no-eating-while-walking', 'ja');
  });

  it('該当マナーが無ければ（null）data は null', async () => {
    const repository: MannerRepository = {
      findAll: jest.fn(async () => []),
      findById: jest.fn(async () => null),
    };
    const { Wrapper } = createWrapper(repository);

    const { result } = renderHook(() => useMannerDetail('does-not-exist'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('一覧キャッシュがあれば取得完了前に placeholder として返す', async () => {
    const repository = createStubRepository();
    const { Wrapper, queryClient } = createWrapper(repository);
    const listItem = makeManner('no-eating-while-walking', '食べ歩き禁止（一覧）');
    queryClient.setQueryData([...MANNERS_QUERY_KEY, 'ja'], [listItem]);

    const { result } = renderHook(() => useMannerDetail('no-eating-while-walking'), {
      wrapper: Wrapper,
    });

    expect(result.current.data).toEqual(listItem);
    expect(result.current.isPlaceholderData).toBe(true);

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data).toEqual(DETAIL);
  });

  it('mannerId が未指定のときは取得しない', () => {
    const repository = createStubRepository();
    const { Wrapper } = createWrapper(repository);

    const { result } = renderHook(() => useMannerDetail(null), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('一覧とは別の queryKey を使う', async () => {
    const repository = createStubRepository();
    const { Wrapper, queryClient } = createWrapper(repository);

    const { result } = renderHook(() => useMannerDetail('no-eating-while-walking'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);
    expect(keys).toContainEqual([...MANNERS_QUERY_KEY, 'detail', 'no-eating-while-walking', 'ja']);
  });
});
