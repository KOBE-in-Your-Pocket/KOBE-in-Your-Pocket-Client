import { create } from 'zustand';

import type { Review } from '../domain/review';

/** レビュー編集で変更できるフィールド。 */
export type ReviewEdit = Pick<Review, 'rating' | 'comment'>;

type ReviewStoreState = {
  /**
   * ユーザーが投稿したレビュー（spotId 別）。
   * mock のためメモリ保持（アプリ再起動で消える）。実 API 化時はサーバーが保持する。
   */
  submittedReviews: Record<string, Review[]>;
  /** レビューを投稿する（末尾に追加）。 */
  addReview: (spotId: string, review: Review) => void;
  /** 自分の投稿レビューを編集する（id 一致のものだけ rating / comment を更新）。 */
  updateReview: (spotId: string, reviewId: string, changes: ReviewEdit) => void;
  /** 自分の投稿レビューを削除する（id 一致のものを除去）。 */
  deleteReview: (spotId: string, reviewId: string) => void;
  /**
   * 表示名変更時の暫定対応（#516）。
   * 全スポット横断で `author.id` が一致するレビューの `author.name` / `author.iconUrl` を書き換える。
   */
  updateAuthorInfo: (
    authorId: string,
    authorInfo: Pick<Review['author'], 'name' | 'iconUrl'>,
  ) => void;
};

/**
 * 投稿/編集されたレビューを保持する mock ストア（#129）。
 * 取得側の `fetchReviews`（seed）とは別に「ユーザー投稿分」を保持し、
 * application 層でこの 2 つを結合して一覧に反映する。
 */
export const useReviewStore = create<ReviewStoreState>((set) => ({
  submittedReviews: {},
  addReview: (spotId, review) =>
    set((state) => ({
      submittedReviews: {
        ...state.submittedReviews,
        [spotId]: [...(state.submittedReviews[spotId] ?? []), review],
      },
    })),
  updateReview: (spotId, reviewId, changes) =>
    set((state) => {
      const current = state.submittedReviews[spotId];
      if (!current) return state;
      return {
        submittedReviews: {
          ...state.submittedReviews,
          [spotId]: current.map((review) =>
            review.id === reviewId ? { ...review, ...changes } : review,
          ),
        },
      };
    }),
  deleteReview: (spotId, reviewId) =>
    set((state) => ({
      submittedReviews: {
        ...state.submittedReviews,
        [spotId]: (state.submittedReviews[spotId] ?? []).filter((r) => r.id !== reviewId),
      },
    })),
  updateAuthorInfo: (authorId, authorInfo) =>
    set((state) => ({
      submittedReviews: Object.fromEntries(
        Object.entries(state.submittedReviews).map(([spotId, reviews]) => [
          spotId,
          reviews.map((review) =>
            review.author.id === authorId
              ? { ...review, author: { ...review.author, ...authorInfo } }
              : review,
          ),
        ]),
      ),
    })),
}));
