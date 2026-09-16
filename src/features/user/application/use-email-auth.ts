import { useMutation } from '@tanstack/react-query';

import { AuthApiError } from '../domain/auth-api-error';
import type { AuthSession, EmailSignUpResult } from '../domain/auth-session';
import type { AuthGateway, SessionStore } from '../domain/auth-ports';
import { defaultAuthGateway, defaultSessionStore } from './auth-deps';
import {
  bumpSessionGeneration,
  commitSession,
  getSessionGeneration,
  isSessionGenerationCurrent,
} from './session-operation';

type EmailAuthDeps = {
  authGateway: AuthGateway;
  sessionStore: SessionStore;
};

const defaultDeps: EmailAuthDeps = {
  authGateway: defaultAuthGateway,
  sessionStore: defaultSessionStore,
};

export type EmailSignInInput = {
  email: string;
  password: string;
};

export type EmailSignUpInput = {
  email: string;
  password: string;
  name: string;
};

/** メールサインイン失敗の種別（UI 表示用の安定した分類）。 */
export type EmailSignInErrorKind = 'invalidCredentials' | 'emailNotConfirmed' | 'unknown';

/** メール新規登録失敗の種別（UI 表示用の安定した分類）。 */
export type EmailSignUpErrorKind = 'emailRateLimited' | 'unknown';

/**
 * サインイン失敗のエラーを UI 表示用の種別へ変換する。
 * HTTP ステータスや GoTrue のエラー内容の解釈は application 層に閉じる。
 */
export function resolveEmailSignInErrorKind(error: unknown): EmailSignInErrorKind {
  if (!(error instanceof AuthApiError)) {
    return 'unknown';
  }
  if (error.status !== 400 && error.status !== 401) {
    return 'unknown';
  }

  // backend は GoTrue のエラー JSON を message にそのまま載せるため、ここで判別する。
  return error.message.includes('email_not_confirmed') ? 'emailNotConfirmed' : 'invalidCredentials';
}

/** 新規登録失敗のエラーを UI 表示用の種別へ変換する。 */
export function resolveEmailSignUpErrorKind(error: unknown): EmailSignUpErrorKind {
  // Supabase 内蔵メールの送信レート制限（429 over_email_send_rate_limit）。
  if (error instanceof AuthApiError && error.status === 429) {
    return 'emailRateLimited';
  }
  return 'unknown';
}

/** メールアドレスとパスワードでサインインし、永続化・ストア更新まで行う。 */
export async function performEmailSignIn(
  input: EmailSignInInput,
  deps: EmailAuthDeps = defaultDeps,
): Promise<AuthSession | null> {
  bumpSessionGeneration();
  const generation = getSessionGeneration();

  const session = await deps.authGateway.signInWithEmail(input);
  return commitSession(session, generation, deps.sessionStore);
}

/**
 * メールアドレスとパスワードで新規登録する。
 * backend がセッションを発行した場合は永続化・ストア更新まで行いログイン状態になる。
 * メール確認が有効な場合は confirmationRequired が返り、ログイン状態にはならない
 * （ユーザーは確認メールのリンクを開いてからログインする）。
 * 進行中に別のセッション操作が始まった場合は null を返す。
 */
export async function performEmailSignUp(
  input: EmailSignUpInput,
  deps: EmailAuthDeps = defaultDeps,
): Promise<EmailSignUpResult | null> {
  bumpSessionGeneration();
  const generation = getSessionGeneration();

  const result = await deps.authGateway.signUpWithEmail(input);
  if (!isSessionGenerationCurrent(generation)) {
    return null;
  }
  if (result.status === 'confirmationRequired') {
    return result;
  }

  const session = await commitSession(result.session, generation, deps.sessionStore);
  return session ? result : null;
}

/** メールサインインを実行する mutation。 */
export function useEmailSignIn() {
  return useMutation({
    mutationFn: (input: EmailSignInInput) => performEmailSignIn(input),
  });
}

/** メール新規登録を実行する mutation。 */
export function useEmailSignUp() {
  return useMutation({
    mutationFn: (input: EmailSignUpInput) => performEmailSignUp(input),
  });
}
