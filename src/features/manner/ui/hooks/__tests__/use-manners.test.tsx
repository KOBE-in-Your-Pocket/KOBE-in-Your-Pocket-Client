import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import type { MannerItem } from '../../../domain/manner-item';
import type { MannerRepository } from '../../../domain/manner-repository';
import { MANNERS_QUERY_KEY } from '../../../application/manner-query-keys';
import { MannerRepositoryProvider } from '../../../application/manner-repository-context';
import { useManners } from '../use-manners';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));

const ITEMS: MannerItem[] = [
  {
    id: 'test-manner',
    title: 'Test',
    description: 'Description',
    icon: 'test',
    imageKey: null,
    kind: 'manner',
    scope: 'local',
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

describe('useManners', () => {
  it('解決した言語で repository.findAll を呼び、結果を返す', async () => {
    const repository = createStubRepository();
    const { Wrapper } = createWrapper(repository);

    const { result } = renderHook(() => useManners(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(ITEMS);
    expect(repository.findAll).toHaveBeenCalledWith('en');
  });

  it('queryKey に解決済み言語が含まれる', async () => {
    const repository = createStubRepository();
    const { Wrapper, queryClient } = createWrapper(repository);

    const { result } = renderHook(() => useManners(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);
    expect(keys).toContainEqual([...MANNERS_QUERY_KEY, 'en']);
  });
});
