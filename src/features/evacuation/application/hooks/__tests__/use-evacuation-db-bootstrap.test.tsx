import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useUiStore } from '@/shared/store';

import { bootstrapEvacuationDatabase } from '../../use-cases/bootstrap-evacuation-database';
import { useEvacuationDbBootstrap } from '../use-evacuation-db-bootstrap';

import type { PropsWithChildren } from 'react';

jest.mock('../../use-cases/bootstrap-evacuation-database', () => ({
  bootstrapEvacuationDatabase: jest.fn(),
}));

jest.mock('../../use-cases/local-evacuation-shelter-queries', () => ({
  getEvacuationSheltersFromLocalDb: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ja' } }),
}));

function renderBootstrap() {
  const queryClient = new QueryClient();
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const { unmount } = renderHook(() => useEvacuationDbBootstrap(), { wrapper });

  return { invalidateQueries, unmount };
}

describe('useEvacuationDbBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.setState({ language: 'ja' });
  });

  it('再シードで DB が書き換わったら避難所系のクエリを invalidate する', async () => {
    let resolveReseeded: ((value: boolean) => void) | undefined;
    jest.mocked(bootstrapEvacuationDatabase).mockResolvedValue({
      reseeded: new Promise((resolve) => {
        resolveReseeded = resolve;
      }),
    });

    const { invalidateQueries } = renderBootstrap();

    await waitFor(() => expect(bootstrapEvacuationDatabase).toHaveBeenCalledWith('ja'));
    expect(invalidateQueries).not.toHaveBeenCalled();

    resolveReseeded?.(true);

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['evacuation', 'shelters'] }),
    );
  });

  it('再シードしなかった・失敗したときは invalidate しない', async () => {
    const reseeded = Promise.resolve(false);
    jest.mocked(bootstrapEvacuationDatabase).mockResolvedValue({ reseeded });

    const { invalidateQueries } = renderBootstrap();

    await waitFor(() => expect(bootstrapEvacuationDatabase).toHaveBeenCalled());
    await reseeded;
    await Promise.resolve();

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('取り直しの完了前に言語が変わった・アンマウントされたときは invalidate しない', async () => {
    let resolveReseeded: ((value: boolean) => void) | undefined;
    const reseeded = new Promise<boolean>((resolve) => {
      resolveReseeded = resolve;
    });
    jest.mocked(bootstrapEvacuationDatabase).mockResolvedValue({ reseeded });

    const { invalidateQueries, unmount } = renderBootstrap();

    await waitFor(() => expect(bootstrapEvacuationDatabase).toHaveBeenCalled());
    unmount();
    resolveReseeded?.(true);
    await reseeded;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('bootstrap 自体が失敗してもログに残すだけで invalidate しない', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.mocked(bootstrapEvacuationDatabase).mockRejectedValue(new Error('offline'));

    const { invalidateQueries } = renderBootstrap();

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(invalidateQueries).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
