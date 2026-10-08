import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { AuthSession } from '../domain/auth-session';
import type { AuthGateway, SessionStore } from '../domain/auth-ports';
import { defaultAuthGateway, defaultSessionStore } from './auth-deps';
import { bumpSessionGeneration, commitSession, getSessionGeneration } from './session-operation';

/** ユーザーが Apple のサインインシートを閉じたときのエラーコード。 */
const APPLE_SIGN_IN_CANCELED = 'ERR_REQUEST_CANCELED';

type AppleSignInDeps = {
  authGateway: AuthGateway;
  sessionStore: SessionStore;
};

function isAppleSignInCanceled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === APPLE_SIGN_IN_CANCELED
  );
}

/**
 * Apple サインインの一連の流れを実行する。
 *
 * nonce を生成 → SHA-256 ハッシュを Apple へ渡してネイティブサインイン →
 * ID トークンと生の nonce を backend へ POST → secure-store への永続化 → ストア更新。
 * ユーザーがサインインをキャンセルした場合は null を返す（エラーにしない）。
 */
export async function performAppleSignIn(
  deps: AppleSignInDeps = {
    authGateway: defaultAuthGateway,
    sessionStore: defaultSessionStore,
  },
): Promise<AuthSession | null> {
  bumpSessionGeneration();
  const generation = getSessionGeneration();

  // Apple の ID トークンにはハッシュ済み nonce が埋め込まれ、GoTrue は生の nonce をハッシュして照合する。
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isAppleSignInCanceled(error)) {
      return null;
    }
    throw error;
  }

  const idToken = credential.identityToken;
  if (!idToken) {
    throw new Error('Apple から ID トークンを取得できませんでした。');
  }

  const session = await deps.authGateway.signInWithApple({ idToken, nonce: rawNonce });
  return commitSession(session, generation, deps.sessionStore);
}

/** Apple サインインを実行する mutation。キャンセル時は null で成功扱いになる。 */
export function useAppleSignIn() {
  return useMutation({
    mutationFn: () => performAppleSignIn(),
  });
}

/**
 * この端末で Apple サインインを使えるかを返す（iOS 13+ のみ true）。
 * 判定が終わるまでは false のため、ボタンは判定後に表示される。
 */
export function useAppleSignInAvailable(): boolean {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    let active = true;
    AppleAuthentication.isAvailableAsync()
      .then((result) => {
        if (active) {
          setAvailable(result);
        }
      })
      .catch(() => {
        // 判定に失敗した場合はボタンを出さない。
      });

    return () => {
      active = false;
    };
  }, []);

  return available;
}
