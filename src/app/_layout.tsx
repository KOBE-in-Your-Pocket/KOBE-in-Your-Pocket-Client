import { Stack } from 'expo-router';

import { PrivacyConsentGate } from '@/features/legal';
import { createApiMannerRepository, MannerRepositoryProvider } from '@/features/manner';
import { createAuthTokenProvider, useRestoreSession, useSyncCurrentUser } from '@/features/user';
import { warnIfApiBaseUrlMissing } from '@/shared/config';
import { setAuthTokenProvider } from '@/shared/lib/api';
import { AppProviders } from '@/shared/ui';

warnIfApiBaseUrlMissing();

// 認証付き API 呼び出しのトークン供給を composition root で注入する（#506）。
setAuthTokenProvider(createAuthTokenProvider());

const mannerRepository = createApiMannerRepository();

/**
 * QueryClientProvider（AppProviders 内）を必要とする起動時の副作用をまとめる。
 * RootLayout 直下では QueryClient がまだ無いため、Provider の内側で実行する。
 */
function AppBootstrap() {
  useSyncCurrentUser();

  return (
    <MannerRepositoryProvider repository={mannerRepository}>
      <Stack screenOptions={{ headerShown: false }} />
    </MannerRepositoryProvider>
  );
}

export default function RootLayout() {
  useRestoreSession();

  return (
    <AppProviders>
      <PrivacyConsentGate>
        <AppBootstrap />
      </PrivacyConsentGate>
    </AppProviders>
  );
}
