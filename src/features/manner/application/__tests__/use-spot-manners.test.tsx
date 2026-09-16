import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import type { MannerItem } from '../../domain/manner-item';
import type { MannerRepository } from '../../domain/manner-repository';
import { MANNERS_QUERY_KEY } from '../manner-query-keys';
import { MannerRepositoryProvider } from '../manner-repository-context';
import { useSpotManners } from '../use-spot-manners';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));

const ITEMS: MannerItem[] = [
  {
    id: 'manner-a',
    title: 'A',
    description: 'A',
    icon: 'a',
    imageKey: null,
    kind: 'manner',
    scope: 'local',
    relatedSpotIds: ['nankinmachi'],
  },
  {
    id: 'manner-b',
    title: 'B',
    description: 'B',
    icon: 'b',
    imageKey: null,
    kind: 'rule',
    scope: 'local',
    relatedSpotIds: ['kitano-ijinkan'],
  },
  {
    id: 'manner-c',
    title: 'C',
    description: 'C',
    icon: 'c',
    imageKey: null,
    kind: 'manner',
    scope: 'japan',
    relatedSpotIds: [],
  },
];

function createStubRepository(): MannerRepository {
  return {
    findAll: jest.fn(async () => ITEMS),
    findById: jest.fn(async () => null),
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

describe('useSpotManners', () => {
  it('spotId に紐づくマナー項目だけを返す', async () => {
    const repository = createStubRepository();
    const { Wrapper } = createWrapper(repository);

    const { result } = renderHook(() => useSpotManners('nankinmachi'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([ITEMS[0]]);
    expect(repository.findAll).toHaveBeenCalledWith('en');
  });

  it('該当マナーが無ければ空配列を返す', async () => {
    const repository = createStubRepository();
    const { Wrapper } = createWrapper(repository);

    const { result } = renderHook(() => useSpotManners('unknown-spot'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('spotId が未指定のときは取得しない', () => {
    const repository = createStubRepository();
    const { Wrapper } = createWrapper(repository);

    const { result } = renderHook(() => useSpotManners(null), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(repository.findAll).not.toHaveBeenCalled();
  });

  it('useManners と同じ queryKey を共有する', async () => {
    const repository = createStubRepository();
    const { Wrapper, queryClient } = createWrapper(repository);

    const { result } = renderHook(() => useSpotManners('nankinmachi'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);
    expect(keys).toContainEqual([...MANNERS_QUERY_KEY, 'en']);
  });
});
