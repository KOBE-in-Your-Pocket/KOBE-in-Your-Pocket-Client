import { useMutation } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { normalizeAppleDisplayName } from '../domain/apple-display-name';
import type { AuthSession } from '../domain/auth-session';
import type { AuthGateway, PendingAppleNameStore, SessionStore } from '../domain/auth-ports';
import { defaultAuthGateway, defaultPendingAppleNameStore, defaultSessionStore } from './auth-deps';
import { bumpSessionGeneration, commitSession, getSessionGeneration } from './session-operation';

/** nonce の生成に使う乱数のバイト数。 */
const NONCE_BYTE_LENGTH = 32;

type AppleSignInDeps = {
  authGateway: AuthGateway;
  sessionStore: SessionStore;
  pendingNameStore: PendingAppleNameStore;
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * リプレイ攻撃対策の nonce を生成する。
 * Apple には SHA-256 ハッシュ（hex）を渡し、backend（GoTrue）には元の値を渡して照合させる。
 */
async function createNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = toHex(await Crypto.getRandomBytesAsync(NONCE_BYTE_LENGTH));
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  return { rawNonce, hashedNonce };
}

function isCanceledError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'ERR_REQUEST_CANCELED'
  );
}

/**
 * backend へ送る表示名を決める。
 * Apple が今回 fullName を返したらそれを保存して使い、返さなければ同じ Apple ID の保存済みの値を使う。
 * 一時保存の読み書きに失敗してもサインイン自体は続行する（表示名は後から変更できる）。
 */
async function resolveDisplayName(
  credential: AppleAuthentication.AppleAuthenticationCredential,
  pendingNameStore: PendingAppleNameStore,
): Promise<string | undefined> {
  const freshName = credential.fullName
    ? normalizeAppleDisplayName(AppleAuthentication.formatFullName(credential.fullName))
    : null;

  if (freshName) {
    try {
      await pendingNameStore.savePendingAppleName({
        appleUserId: credential.user,
        name: freshName,
      });
    } catch {
      // 保存できなくても今回の送信には使える。
    }
    return freshName;
  }

  try {
    const pending = await pendingNameStore.loadPendingAppleName();
    if (pending?.appleUserId === credential.user) {
      return normalizeAppleDisplayName(pending.name) ?? undefined;
    }
  } catch {
    // 読めなければ表示名なしで送る（backend 側のフォールバックになる）。
  }
  return undefined;
}

/**
 * Apple サインインの一連の流れを実行する。
 *
 * Apple のネイティブサインイン → ID トークン・nonce・初回の表示名・authorizationCode を backend へ POST →
 * secure-store への永続化 → ストア更新。
 * ユーザーがサインインをキャンセルした場合は null を返す（エラーにしない）。
 */
export async function performAppleSignIn(
  deps: AppleSignInDeps = {
    authGateway: defaultAuthGateway,
    sessionStore: defaultSessionStore,
    pendingNameStore: defaultPendingAppleNameStore,
  },
): Promise<AuthSession | null> {
  bumpSessionGeneration();
  const generation = getSessionGeneration();

  const { rawNonce, hashedNonce } = await createNonce();

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
    if (isCanceledError(error)) {
      return null;
    }
    throw error;
  }

  const idToken = credential.identityToken;
  if (!idToken) {
    throw new Error('Apple から identityToken を取得できませんでした。');
  }

  const name = await resolveDisplayName(credential, deps.pendingNameStore);

  // authorizationCode は退会時のトークン失効用（Backend #213）。5 分・1 回限りのため一時保存はしない。
  const session = await deps.authGateway.signInWithApple({
    idToken,
    nonce: rawNonce,
    name,
    authorizationCode: credential.authorizationCode ?? undefined,
  });

  // backend へ渡せたので一時保存は不要。消せなくても既存プロフィールは上書きされないため無害。
  try {
    await deps.pendingNameStore.clearPendingAppleName();
  } catch {
    // 無視する。
  }

  return commitSession(session, generation, deps.sessionStore);
}

/** Apple サインインを実行する mutation。キャンセル時は null で成功扱いになる。 */
export function useAppleSignIn() {
  return useMutation({
    mutationFn: () => performAppleSignIn(),
  });
}

/**
 * この端末で Apple サインインを提供できるかを返す。
 * iOS 以外は常に false。iOS でも isAvailableAsync が true を返すまでは false（ボタンを出さない）。
 */
export function useIsAppleSignInAvailable(): boolean {
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
        // 判定できなければ出さない。
      });
    return () => {
      active = false;
    };
  }, []);

  return available;
}
