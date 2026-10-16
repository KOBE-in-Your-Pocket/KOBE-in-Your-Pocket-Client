import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * ブロックしたレビュー投稿者の ID（#663）。
 *
 * ブロックの正はサーバー（`user_blocks`）で、一覧の取得時にサーバー側でも除外される。
 * 端末にも持つのは、ブロック直後に再取得を待たずに全スポットから消すため。
 */
type BlockedAuthorStoreState = {
  /** 同じ端末で別アカウントに切り替えたときに混ざらないよう、ユーザー ID 別に持つ。 */
  blockedAuthorIds: Record<string, string[]>;
  markBlocked: (userId: string, authorId: string) => void;
  clearForUser: (userId: string) => void;
};

export const useBlockedAuthorStore = create<BlockedAuthorStoreState>()(
  persist(
    (set) => ({
      blockedAuthorIds: {},
      markBlocked: (userId, authorId) =>
        set((state) => {
          const current = state.blockedAuthorIds[userId] ?? [];
          if (current.includes(authorId)) return state;
          return {
            blockedAuthorIds: { ...state.blockedAuthorIds, [userId]: [...current, authorId] },
          };
        }),
      clearForUser: (userId) =>
        set((state) => {
          const { [userId]: _removed, ...rest } = state.blockedAuthorIds;
          return { blockedAuthorIds: rest };
        }),
    }),
    {
      name: 'tourism-blocked-authors',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ blockedAuthorIds: state.blockedAuthorIds }),
    },
  ),
);

const NO_BLOCKED_AUTHORS: readonly string[] = [];

export function useBlockedAuthorIds(userId: string | undefined): readonly string[] {
  return useBlockedAuthorStore((state) =>
    userId ? (state.blockedAuthorIds[userId] ?? NO_BLOCKED_AUTHORS) : NO_BLOCKED_AUTHORS,
  );
}
