import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { useKindFilterStore } from '../../../store/use-kind-filter-store';
import { useScopeFilterStore } from '../../../store/use-scope-filter-store';
import type { MannerItem } from '../../../domain/manner-item';
import type { MannerRepository } from '../../../domain/manner-repository';
import { MannerRepositoryProvider } from '../../../application/manner-repository-context';
import { useFilteredManners } from '../use-filtered-manners';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));

const RULE_ITEM: MannerItem = {
  id: 'no-trespassing',
  title: 'No trespassing',
  description: '',
  icon: 'no-trespassing',
  imageKey: null,
  kind: 'rule',
  scope: 'local',
  relatedSpotIds: [],
};

const MANNER_ITEM: MannerItem = {
  id: 'show-consideration',
  title: 'Show consideration',
  description: '',
  icon: 'show-consideration',
  imageKey: null,
  kind: 'manner',
  scope: 'local',
  relatedSpotIds: [],
};

const JAPAN_RULE_ITEM: MannerItem = {
  id: 'no-smoking-while-walking',
  title: 'No smoking while walking',
  description: '',
  icon: 'no-smoking-while-walking',
  imageKey: null,
  kind: 'rule',
  scope: 'japan',
  relatedSpotIds: [],
};

const ITEMS: MannerItem[] = [RULE_ITEM, MANNER_ITEM, JAPAN_RULE_ITEM];

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

  return { Wrapper };
}

function renderFilteredManners() {
  const repository = createStubRepository();
  const { Wrapper } = createWrapper(repository);
  return renderHook(() => useFilteredManners(), { wrapper: Wrapper });
}

describe('useFilteredManners', () => {
  beforeEach(() => {
    useKindFilterStore.setState({ selectedKind: 'all' });
    useScopeFilterStore.setState({ selectedScope: 'all' });
  });

  it("selectedKind・selectedScope が 'all' のとき全件を返す", async () => {
    const { result } = renderFilteredManners();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(ITEMS);
  });

  it("selectedKind が 'rule' のときルール項目のみ返す", async () => {
    useKindFilterStore.setState({ selectedKind: 'rule' });

    const { result } = renderFilteredManners();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([RULE_ITEM, JAPAN_RULE_ITEM]);
  });

  it("selectedKind が 'manner' のときマナー項目のみ返す", async () => {
    useKindFilterStore.setState({ selectedKind: 'manner' });

    const { result } = renderFilteredManners();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([MANNER_ITEM]);
  });

  it("selectedScope が 'local' のとき各所特有項目のみ返す", async () => {
    useScopeFilterStore.setState({ selectedScope: 'local' });

    const { result } = renderFilteredManners();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([RULE_ITEM, MANNER_ITEM]);
  });

  it("selectedScope が 'japan' のとき日本全般項目のみ返す", async () => {
    useScopeFilterStore.setState({ selectedScope: 'japan' });

    const { result } = renderFilteredManners();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([JAPAN_RULE_ITEM]);
  });

  it('selectedKind と selectedScope を組み合わせて絞り込める', async () => {
    useKindFilterStore.setState({ selectedKind: 'rule' });
    useScopeFilterStore.setState({ selectedScope: 'local' });

    const { result } = renderFilteredManners();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([RULE_ITEM]);
  });

  it('取得完了までは data が undefined である', () => {
    const { result } = renderFilteredManners();

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});
