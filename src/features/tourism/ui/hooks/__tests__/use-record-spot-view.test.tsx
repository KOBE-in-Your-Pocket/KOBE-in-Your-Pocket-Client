import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { SpotViewRepositoryProvider } from '../../../application/spot-view-repository-context';
import { useRecordSpotView } from '../use-record-spot-view';

import type { SpotViewRepository } from '../../../domain/spot-view';
import type { PropsWithChildren } from 'react';

function createStubRepository(): SpotViewRepository & { recordSpotView: jest.Mock } {
  return { recordSpotView: jest.fn(async () => undefined) };
}

function createWrapper(repository: SpotViewRepository) {
  // アプリと同じく、mutation の retry は既定（0 回）のままにする。
  const queryClient = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <SpotViewRepositoryProvider repository={repository}>{children}</SpotViewRepositoryProvider>
    </QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useRecordSpotView', () => {
  it('注入された repository で、渡したスポットの閲覧を 1 回数える', async () => {
    const repository = createStubRepository();
    const { queryClient, wrapper } = createWrapper(repository);
    const { result } = renderHook(() => useRecordSpotView(), { wrapper });

    act(() => result.current('kobe-port-tower'));

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(repository.recordSpotView).toHaveBeenCalledTimes(1);
    expect(repository.recordSpotView).toHaveBeenCalledWith('kobe-port-tower');
  });

  it('呼ぶたびに数える（重複の扱いは backend に任せる）', async () => {
    const repository = createStubRepository();
    const { queryClient, wrapper } = createWrapper(repository);
    const { result } = renderHook(() => useRecordSpotView(), { wrapper });

    act(() => {
      result.current('kobe-port-tower');
      result.current('kobe-port-tower');
    });

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(repository.recordSpotView).toHaveBeenCalledTimes(2);
  });

  it('失敗しても例外を投げず、再試行もしない', async () => {
    const repository = createStubRepository();
    repository.recordSpotView.mockRejectedValue(new Error('network error'));
    const { queryClient, wrapper } = createWrapper(repository);
    const { result } = renderHook(() => useRecordSpotView(), { wrapper });

    expect(() => act(() => result.current('kobe-port-tower'))).not.toThrow();

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(repository.recordSpotView).toHaveBeenCalledTimes(1);
  });

  it('再レンダーしても同じ関数を返す', () => {
    const { wrapper } = createWrapper(createStubRepository());
    const { result, rerender } = renderHook(() => useRecordSpotView(), { wrapper });
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });

  it('Provider の外で使うと例外を投げる', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useRecordSpotView(), { wrapper })).toThrow(
      'SpotViewRepositoryProvider',
    );
  });
});
