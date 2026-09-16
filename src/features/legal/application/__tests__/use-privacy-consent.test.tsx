import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { ConsentStore, PolicyConsent } from '../../domain/privacy-policy';
import { PRIVACY_POLICY_VERSION } from '../../domain/privacy-policy';
import { usePrivacyConsent } from '../use-privacy-consent';

const createStore = (overrides: Partial<ConsentStore> = {}): ConsentStore => ({
  loadConsent: jest.fn<Promise<PolicyConsent | null>, []>().mockResolvedValue(null),
  saveConsent: jest.fn<Promise<void>, [PolicyConsent]>().mockResolvedValue(undefined),
  ...overrides,
});

describe('usePrivacyConsent', () => {
  it('現在の版数に同意済みなら granted になる', async () => {
    const store = createStore({
      loadConsent: jest.fn().mockResolvedValue({
        version: PRIVACY_POLICY_VERSION,
        agreedAt: '2026-09-07T00:00:00.000Z',
        isAdult: true,
      }),
    });

    const { result } = renderHook(() => usePrivacyConsent(store));

    await waitFor(() => expect(result.current.status).toBe('granted'));
  });

  it('成人として同意済みなら isAdult が true になる', async () => {
    const store = createStore({
      loadConsent: jest.fn().mockResolvedValue({
        version: PRIVACY_POLICY_VERSION,
        agreedAt: '2026-09-07T00:00:00.000Z',
        isAdult: true,
      }),
    });

    const { result } = renderHook(() => usePrivacyConsent(store));

    await waitFor(() => expect(result.current.isAdult).toBe(true));
  });

  it('未成年として同意済みなら granted かつ isAdult が false になる', async () => {
    // 未成年でも閲覧のためにアプリ本体へは進める。制限されるのは個人情報に関わる機能だけ。
    const store = createStore({
      loadConsent: jest.fn().mockResolvedValue({
        version: PRIVACY_POLICY_VERSION,
        agreedAt: '2026-09-07T00:00:00.000Z',
        isAdult: false,
      }),
    });

    const { result } = renderHook(() => usePrivacyConsent(store));

    await waitFor(() => expect(result.current.status).toBe('granted'));
    expect(result.current.isAdult).toBe(false);
  });

  it('未同意なら required になり isAdult は false のままである', async () => {
    const { result } = renderHook(() => usePrivacyConsent(createStore()));

    await waitFor(() => expect(result.current.status).toBe('required'));
    expect(result.current.isAdult).toBe(false);
  });

  it('保存済みの版数が古い場合は再同意を求める', async () => {
    const store = createStore({
      loadConsent: jest.fn().mockResolvedValue({
        version: '2000-01-01',
        agreedAt: '2000-01-01T00:00:00.000Z',
        isAdult: true,
      }),
    });

    const { result } = renderHook(() => usePrivacyConsent(store));

    await waitFor(() => expect(result.current.status).toBe('required'));
  });

  it('版数が古い記録の isAdult は引き継がない', async () => {
    // 再同意を求める以上、年齢の回答も取り直す。古い回答で機能を開けてはいけない。
    const store = createStore({
      loadConsent: jest.fn().mockResolvedValue({
        version: '2000-01-01',
        agreedAt: '2000-01-01T00:00:00.000Z',
        isAdult: true,
      }),
    });

    const { result } = renderHook(() => usePrivacyConsent(store));

    await waitFor(() => expect(result.current.status).toBe('required'));
    expect(result.current.isAdult).toBe(false);
  });

  it('読み出しに失敗した場合は未同意として扱う', async () => {
    const store = createStore({
      loadConsent: jest.fn().mockRejectedValue(new Error('storage unavailable')),
    });

    const { result } = renderHook(() => usePrivacyConsent(store));

    await waitFor(() => expect(result.current.status).toBe('required'));
    expect(result.current.isAdult).toBe(false);
  });

  it('accept(true) で成人として記録し granted になる', async () => {
    const store = createStore();
    const { result } = renderHook(() => usePrivacyConsent(store));
    await waitFor(() => expect(result.current.status).toBe('required'));

    await act(async () => {
      await result.current.accept(true);
    });

    expect(store.saveConsent).toHaveBeenCalledWith({
      version: PRIVACY_POLICY_VERSION,
      agreedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      isAdult: true,
    });
    expect(result.current.status).toBe('granted');
    expect(result.current.isAdult).toBe(true);
  });

  it('accept(false) で未成年として記録し granted になる', async () => {
    const store = createStore();
    const { result } = renderHook(() => usePrivacyConsent(store));
    await waitFor(() => expect(result.current.status).toBe('required'));

    await act(async () => {
      await result.current.accept(false);
    });

    expect(store.saveConsent).toHaveBeenCalledWith({
      version: PRIVACY_POLICY_VERSION,
      agreedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      isAdult: false,
    });
    expect(result.current.status).toBe('granted');
    expect(result.current.isAdult).toBe(false);
  });

  it('保存に失敗した場合は granted にせず呼び出し元へ例外を伝える', async () => {
    const store = createStore({
      saveConsent: jest.fn().mockRejectedValue(new Error('write failed')),
    });
    const { result } = renderHook(() => usePrivacyConsent(store));
    await waitFor(() => expect(result.current.status).toBe('required'));

    await act(async () => {
      await expect(result.current.accept(true)).rejects.toThrow('write failed');
    });

    expect(result.current.status).toBe('required');
    expect(result.current.isAdult).toBe(false);
  });
});
