import { useReportedReviewStore } from '../use-reported-review-store';

describe('useReportedReviewStore', () => {
  beforeEach(() => {
    useReportedReviewStore.setState({ reportedReviewIds: {} });
  });

  it('ユーザー別に通報済みレビューを記録し、重複は追加しない', () => {
    const { markReported } = useReportedReviewStore.getState();

    markReported('user-a', 'review-1');
    markReported('user-a', 'review-1');
    markReported('user-b', 'review-2');

    expect(useReportedReviewStore.getState().reportedReviewIds).toEqual({
      'user-a': ['review-1'],
      'user-b': ['review-2'],
    });
  });

  it('退会したユーザーの記録だけを消す', () => {
    useReportedReviewStore.setState({
      reportedReviewIds: { 'user-a': ['review-1'], 'user-b': ['review-2'] },
    });

    useReportedReviewStore.getState().clearForUser('user-a');

    expect(useReportedReviewStore.getState().reportedReviewIds).toEqual({
      'user-b': ['review-2'],
    });
  });
});
