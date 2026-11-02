import { Stack } from 'expo-router';

import { useEvacuationDbBootstrap } from '@/features/evacuation';
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
 * プライバシーポリシーへの同意後にだけ実行する起動時の副作用をまとめる（#697）。
 *
 * `PrivacyConsentGate` の内側でマウントされるため、未同意の間はセッション復元や
 * 避難所データの取得といった通信を一切行わない。あわせて QueryClientProvider
 * （AppProviders 内）を必要とする副作用もここで実行する。
 */
function AppBootstrap() {
  useRestoreSession();
  useEvacuationDbBootstrap();
  useSyncCurrentUser();

  return (
    <MannerRepositoryProvider repository={mannerRepository}>
      <Stack screenOptions={{ headerShown: false }} />
    </MannerRepositoryProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <PrivacyConsentGate>
        <AppBootstrap />
      </PrivacyConsentGate>
    </AppProviders>
  );
}
