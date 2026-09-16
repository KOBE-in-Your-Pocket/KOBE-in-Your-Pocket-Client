import type { PublicUser } from '../domain/public-user';
import { useAuthStore } from '../store/use-auth-store';

/**
 * 現在ログイン中のユーザーを返す。未ログイン時は null。
 *
 * 認証状態は {@link useAuthStore} が保持する。呼び出し側は null
 * （＝未ログイン）を必ず考慮すること。
 */
export function useCurrentUser(): PublicUser | null {
  return useAuthStore((state) => state.currentUser);
}
