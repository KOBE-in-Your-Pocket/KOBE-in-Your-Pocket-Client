import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { fetchSpotById } from '../../infrastructure/api/spot-api';
import { useSpotDetail } from '../use-spot-detail';
import { SPOTS_QUERY_KEY } from '../use-spots';

import type { Spot } from '../../domain/spot';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ja' } }),
}));

jest.mock('../../infrastructure/api/spot-api', () => ({
  fetchSpotById: jest.fn(),
}));

const mockFetchSpotById = jest.mocked(fetchSpotById);

function makeSpot(id: string, name: string): Spot {
  return {
    id,
    name,
    description: '',
    address: '',
    businessHours: '',
    genre: 'gourmet',
    category: { label: '' },
    media: { imageUrl: '' },
    coordinates: { latitude: 0, longitude: 0 },
  };
}

const DETAIL = makeSpot('nankinmachi', '南京町（詳細）');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, queryClient };
}

describe('useSpotDetail', () => {
  beforeEach(() => {
    mockFetchSpotById.mockReset();
  });

  it('一覧に無いスポットでも詳細 API から取得できる', async () => {
    mockFetchSpotById.mockResolvedValue(DETAIL);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useSpotDetail('nankinmachi'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(DETAIL);
    expect(mockFetchSpotById).toHaveBeenCalledWith('nankinmachi', 'ja');
  });

  it('該当スポットが無ければ（404）data は null', async () => {
    mockFetchSpotById.mockResolvedValue(null);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useSpotDetail('does-not-exist'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('一覧キャッシュがあれば取得完了前に placeholder として返す', async () => {
    mockFetchSpotById.mockResolvedValue(DETAIL);
    const { Wrapper, queryClient } = createWrapper();
    const listSpot = makeSpot('nankinmachi', '南京町（一覧）');
    queryClient.setQueryData([...SPOTS_QUERY_KEY, 'ja'], [listSpot]);

    const { result } = renderHook(() => useSpotDetail('nankinmachi'), { wrapper: Wrapper });

    expect(result.current.data).toEqual(listSpot);
    expect(result.current.isPlaceholderData).toBe(true);

    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
    expect(result.current.data).toEqual(DETAIL);
  });

  it('spotId が未指定のときは取得しない', () => {
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useSpotDetail(null), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchSpotById).not.toHaveBeenCalled();
  });

  it('一覧とは別の queryKey を使う', async () => {
    mockFetchSpotById.mockResolvedValue(DETAIL);
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useSpotDetail('nankinmachi'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const keys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);
    expect(keys).toContainEqual([...SPOTS_QUERY_KEY, 'detail', 'nankinmachi', 'ja']);
  });
});
