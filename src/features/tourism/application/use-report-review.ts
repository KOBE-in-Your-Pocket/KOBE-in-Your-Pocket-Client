import { useMutation } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/user/application/use-current-user';

import { reportReview } from '../infrastructure/api/review-api';

/**
 * 他人のレビューを通報する mutation（#538）。
 *
 * 通報は当面ログイン必須とする。未ログイン時は通報者を確定できないため mutation は
 * エラーで終了する（UI 側は未ログインなら通報を実行せずサインインへ誘導するが、
 * {@link useUpdateReview} と同じく最終防衛線としてここでも弾く）。
 *
 * 通報対象は自分以外のレビューなので、ローカルの一覧・ストアは書き換えない。
 * TODO(#538 follow-up): backend の通報エンドポイント確定後に {@link reportReview} の
 * 実送信を配線する。
 */
export function useReportReview(spotId: string) {
  const reporter = useCurrentUser();

  return useMutation<void, Error, string>({
    mutationFn: async (reviewId) => {
      if (!reporter) {
        throw new Error('未ログインのためレビューを通報できません');
      }

      await reportReview(spotId, reviewId);
    },
  });
}
