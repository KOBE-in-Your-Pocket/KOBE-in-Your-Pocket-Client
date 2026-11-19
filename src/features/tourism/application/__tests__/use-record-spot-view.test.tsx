import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { recordSpotView } from '../../infrastructure/api/spot-view-api';
import { useRecordSpotView } from '../use-record-spot-view';

import type { PropsWithChildren } from 'react';

jest.mock('../../infrastructure/api/spot-view-api', () => ({
  recordSpotView: jest.fn(),
}));

const recordSpotViewMock = jest.mocked(recordSpotView);

function createWrapper() {
  // アプリと同じく、mutation の retry は既定（0 回）のままにする。
  const queryClient = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useRecordSpotView', () => {
  beforeEach(() => {
    recordSpotViewMock.mockReset();
  });

  it('渡したスポットの閲覧を 1 回数える', async () => {
    recordSpotViewMock.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordSpotView(), { wrapper });

    act(() => result.current('kobe-port-tower'));

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(recordSpotViewMock).toHaveBeenCalledTimes(1);
    expect(recordSpotViewMock.mock.calls[0][0]).toBe('kobe-port-tower');
  });

  it('呼ぶたびに数える（重複の扱いは backend に任せる）', async () => {
    recordSpotViewMock.mockResolvedValue(undefined);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordSpotView(), { wrapper });

    act(() => {
      result.current('kobe-port-tower');
      result.current('kobe-port-tower');
    });

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(recordSpotViewMock).toHaveBeenCalledTimes(2);
  });

  it('失敗しても例外を投げず、再試行もしない', async () => {
    recordSpotViewMock.mockRejectedValue(new Error('network error'));
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useRecordSpotView(), { wrapper });

    expect(() => act(() => result.current('kobe-port-tower'))).not.toThrow();

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(recordSpotViewMock).toHaveBeenCalledTimes(1);
  });

  it('再レンダーしても同じ関数を返す', () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(() => useRecordSpotView(), { wrapper });
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });
});
