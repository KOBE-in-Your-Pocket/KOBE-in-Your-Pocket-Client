import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

import RootLayout from '@/app/_layout';
import { ADULT_AGE_THRESHOLD } from '@/features/legal/domain/age-restriction';
import { PRIVACY_POLICY_VERSION } from '@/features/legal/domain/privacy-policy';
import { TERMS_OF_USE_VERSION } from '@/features/legal/domain/terms-of-use';
import { CONSENT_STORAGE_KEY } from '@/features/legal/infrastructure/storage/consent-storage';
import { resetEvacuationDatabaseBootstrapForTests } from '@/features/evacuation/application/use-cases/bootstrap-evacuation-database';
import { useAuthStore } from '@/features/user';
import { initI18n } from '@/shared/lib/i18n';

/**
 * プライバシーポリシーへの同意前に backend への通信が発生しないことを確かめる（#698）。
 *
 * #697 の不具合は「起動時の処理をどこで呼んでいるか」の問題なので、ゲートや
 * `AppBootstrap` 単体ではなく実際の `RootLayout`（`AppProviders` を含む）を描画する。
 * 通信は gateway ではなく `fetch` で捕まえ、認証（独自の postJson）と
 * 避難所（apiFetch）の両経路、および今後増える経路もまとめて検出する。
 * 描画中だけでなく、モジュールの読み込み時やタイマー経由の通信も対象にする。
 * モックはネイティブ・入出力の境界（SQLite・secure-store・fetch）に限る。
 */

// Expo の実行環境は、読み込まれるたびにグローバルの `fetch` を `expo/src/winter/fetch` の
// 実装で入れ直す。`global.fetch` の差し替えだけでは読み込み時の通信を捕まえられないため、
// 入れ直される実装そのものをモックにする。
jest.mock('expo/src/winter/fetch', () => ({
  fetch: jest.fn(async () => new Response('{}', { status: 503 })),
}));

// feature の公開 API（バレル）経由で読み込まれるだけで、この画面では描画しない。
// ネイティブモジュールが無いと読み込み時点で落ちるため、空の部品へ差し替える。
jest.mock('react-native-maps', () => {
  const Stub = () => null;
  return {
    __esModule: true,
    default: Stub,
    Marker: Stub,
    Polyline: Stub,
    PROVIDER_GOOGLE: 'google',
  };
});

// 避難所 DB は空のスタブにする。空なら bootstrap は必ず取得に行くため、
// 同意後に `/evacuation/shelters` が呼ばれることを確かめられる。
jest.mock('@/features/evacuation/infrastructure/db/client', () => ({
  getEvacuationDatabase: jest.fn(() => ({})),
}));
jest.mock('@/features/evacuation/infrastructure/db/run-migrations', () => ({
  runEvacuationMigrations: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/features/evacuation/infrastructure/db/sqlite-evacuation-shelter-repository', () => ({
  createSqliteEvacuationShelterRepository: jest.fn(() => ({
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    replaceAll: jest.fn().mockResolvedValue(undefined),
  })),
}));

const API_BASE_URL = 'https://api.test';
const REFRESH_PATH = '/api/v1/auth/refresh';
const SHELTERS_PATH = '/api/v1/evacuation/shelters';

const PERSISTED_SESSION = JSON.stringify({
  refreshToken: 'stored-refresh-token',
  user: { id: 'user-1', name: 'Test User', iconUrl: '' },
});

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
const originalFetch = global.fetch;
const originalApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

function requestedUrls(): string[] {
  return fetchMock.mock.calls.map(([input]) =>
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  );
}

async function saveConsent(record: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
}

function adultButtonLabel(): string {
  return initI18n().t('legal.consent.acceptAdult', { age: ADULT_AGE_THRESHOLD });
}

/** 未処理の Promise（ストレージ読み出し → 起動時の処理）を流しきる。 */
async function flushPendingWork(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

let rendered: ReturnType<typeof renderRouter> | null = null;

function renderApp() {
  const result = renderRouter({
    _layout: RootLayout,
    index: () => <Text>home</Text>,
  });
  // renderRouter は内部で偽タイマーに切り替える。ストレージ読み出しや通信の Promise を
  // 実際の順序で流したいので、描画後は実タイマーへ戻す。戻す前に、描画中に予約された
  // タイマーを実行しておく（偽タイマーに積まれたままだと、その中の通信を見逃すため）。
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  rendered = result;
  return result;
}

/**
 * 偽タイマーの下でアンマウントし、その時に予約されたタイマーを捨てる。
 * アンマウント時に TanStack Query がキャッシュ破棄用のタイマー（gcTime: 5 分）を入れるため、
 * 実タイマーのままだと Jest のプロセスが終了しなくなる。
 */
function unmountApp(): void {
  if (!rendered) return;
  jest.useFakeTimers();
  rendered.unmount();
  jest.clearAllTimers();
  jest.useRealTimers();
  rendered = null;
}

describe('RootLayout: プライバシー同意前の通信（#698）', () => {
  beforeEach(async () => {
    // 未設定だと apiFetch が fetch の前に例外を投げ、「呼ばれない」が素通りで成り立ってしまう。
    process.env.EXPO_PUBLIC_API_BASE_URL = API_BASE_URL;

    // 中身は検証しないので、どのリクエストにも 503 を返して呼び出しだけを記録する。
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response('{}', { status: 503 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    // 保存済みセッションが無いと restoreSession は通信せずに終わるため、用意しておく。
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(PERSISTED_SESSION);

    await AsyncStorage.clear();
    resetEvacuationDatabaseBootstrapForTests();
    useAuthStore.setState({ currentUser: null });

    // 503 による失敗ログを黙らせる。
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    unmountApp();
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    jest.restoreAllMocks();
  });

  it('RootLayout の読み込み時に fetch が呼ばれない', () => {
    let loadTimeCalls = -1;
    // 読み込み直したモジュールが使う fetch のモックは、同じ isolateModules の中で取り出す。
    // isolateModules の中で読み込み直すには require が必要。
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/app/_layout');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { fetch: expoFetch } = require('expo/src/winter/fetch') as { fetch: jest.Mock };
      loadTimeCalls = expoFetch.mock.calls.length;
    });

    expect(loadTimeCalls).toBe(0);
  });

  it.each([
    ['同意の記録が無い（初回起動）', null],
    [
      'ポリシーの版が古い記録（ポリシー更新後）',
      {
        version: '2000-01-01',
        termsVersion: TERMS_OF_USE_VERSION,
        agreedAt: '2026-09-07T00:00:00.000Z',
        isAdult: true,
      },
    ],
  ])('%s の間は fetch が 1 回も呼ばれない', async (_label, record) => {
    if (record) {
      await saveConsent(record);
    }

    renderApp();

    expect(await screen.findByText(adultButtonLabel())).toBeTruthy();
    await flushPendingWork();

    expect(screen.queryByText('home')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('同意すると、セッション復元と避難所の取得が始まる', async () => {
    renderApp();

    const acceptButton = await screen.findByText(adultButtonLabel());
    await flushPendingWork();
    // 通信は同意の操作より後に始まったことを示すため、押す直前に 0 回であることを確かめる。
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.press(acceptButton);

    await waitFor(() => {
      const urls = requestedUrls();
      expect(urls).toContainEqual(expect.stringContaining(`${API_BASE_URL}${REFRESH_PATH}`));
      expect(urls).toContainEqual(expect.stringContaining(`${API_BASE_URL}${SHELTERS_PATH}`));
    });
  });

  it('起動時に同意済みなら、すぐにセッション復元と避難所の取得が始まる', async () => {
    await saveConsent({
      version: PRIVACY_POLICY_VERSION,
      termsVersion: TERMS_OF_USE_VERSION,
      agreedAt: '2026-09-07T00:00:00.000Z',
      isAdult: true,
    });

    renderApp();

    await waitFor(() => {
      const urls = requestedUrls();
      expect(urls).toContainEqual(expect.stringContaining(`${API_BASE_URL}${REFRESH_PATH}`));
      expect(urls).toContainEqual(expect.stringContaining(`${API_BASE_URL}${SHELTERS_PATH}`));
    });
  });
});
