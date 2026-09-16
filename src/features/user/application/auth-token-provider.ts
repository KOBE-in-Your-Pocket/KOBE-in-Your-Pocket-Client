import type { AuthTokenProvider } from '@/shared/lib/api';

import { useAuthStore } from '../store/use-auth-store';
import { refreshAccessToken } from './refresh-access-token';

/**
 * 認証ストアに載っているトークンを `apiFetch` へ供給する実装。
 *
 * composition root で `setAuthTokenProvider()` に渡す。これにより `shared` 層は
 * `features/user` を import せずに認証付きリクエストを送れる。
 */
export function createAuthTokenProvider(): AuthTokenProvider {
  return {
    getAccessToken: () => useAuthStore.getState().accessToken,
    refreshAccessToken: () => refreshAccessToken(),
  };
}
