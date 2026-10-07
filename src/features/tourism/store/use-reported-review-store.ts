import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ReportedReviewStoreState = {
  /** 同じ端末で別アカウントに切り替えたときに混ざらないよう、ユーザー ID 別に持つ。 */
  reportedReviewIds: Record<string, string[]>;
  markReported: (userId: string, reviewId: string) => void;
  clearForUser: (userId: string) => void;
};

export const useReportedReviewStore = create<ReportedReviewStoreState>()(
  persist(
    (set) => ({
      reportedReviewIds: {},
      markReported: (userId, reviewId) =>
        set((state) => {
          const current = state.reportedReviewIds[userId] ?? [];
          if (current.includes(reviewId)) return state;
          return {
            reportedReviewIds: { ...state.reportedReviewIds, [userId]: [...current, reviewId] },
          };
        }),
      clearForUser: (userId) =>
        set((state) => {
          const { [userId]: _removed, ...rest } = state.reportedReviewIds;
          return { reportedReviewIds: rest };
        }),
    }),
    {
      name: 'tourism-reported-reviews',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ reportedReviewIds: state.reportedReviewIds }),
    },
  ),
);

const NO_REPORTED_REVIEWS: readonly string[] = [];

export function useReportedReviewIds(userId: string | undefined): readonly string[] {
  return useReportedReviewStore((state) =>
    userId ? (state.reportedReviewIds[userId] ?? NO_REPORTED_REVIEWS) : NO_REPORTED_REVIEWS,
  );
}
