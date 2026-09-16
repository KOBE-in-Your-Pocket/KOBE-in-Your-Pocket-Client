import { useReviewStore } from '../use-review-store';

import type { Review } from '../../domain/review';

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r1',
    rating: { value: 5 },
    comment: 'すばらしい眺めでした',
    author: { id: 'user-taro', name: 'Taro', iconUrl: 'https://example.com/a.png' },
    postedAt: '2026-06-29T00:00:00.000Z',
    language: 'ja',
    ...overrides,
  };
}

describe('useReviewStore', () => {
  beforeEach(() => {
    useReviewStore.setState({ submittedReviews: {} });
  });

  it('addReview でスポット別に投稿が追加される', () => {
    useReviewStore.getState().addReview('spot-a', makeReview({ id: 'r1' }));
    useReviewStore.getState().addReview('spot-a', makeReview({ id: 'r2' }));
    useReviewStore.getState().addReview('spot-b', makeReview({ id: 'r3' }));

    const { submittedReviews } = useReviewStore.getState();
    expect(submittedReviews['spot-a'].map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(submittedReviews['spot-b'].map((r) => r.id)).toEqual(['r3']);
  });

  it('updateReview で id 一致のレビューだけ rating / comment が更新される', () => {
    useReviewStore.getState().addReview('spot-a', makeReview({ id: 'r1', comment: '旧コメント' }));
    useReviewStore.getState().addReview('spot-a', makeReview({ id: 'r2', comment: '据え置き' }));

    useReviewStore.getState().updateReview('spot-a', 'r1', {
      rating: { value: 3 },
      comment: '新コメント',
    });

    const list = useReviewStore.getState().submittedReviews['spot-a'];
    expect(list.find((r) => r.id === 'r1')).toMatchObject({
      comment: '新コメント',
      rating: { value: 3 },
    });
    expect(list.find((r) => r.id === 'r2')?.comment).toBe('据え置き');
  });

  it('存在しない spot / id の updateReview は no-op', () => {
    useReviewStore.getState().addReview('spot-a', makeReview({ id: 'r1', comment: 'orig' }));

    useReviewStore.getState().updateReview('spot-x', 'r1', { rating: { value: 1 }, comment: 'x' });
    useReviewStore.getState().updateReview('spot-a', 'zzz', { rating: { value: 1 }, comment: 'x' });

    expect(useReviewStore.getState().submittedReviews['spot-a'][0].comment).toBe('orig');
  });

  it('updateAuthorInfo で全スポット横断で author.id 一致のレビューの author.name / iconUrl が更新される', () => {
    useReviewStore
      .getState()
      .addReview(
        'spot-a',
        makeReview({ id: 'r1', author: { id: 'user-taro', name: 'Taro', iconUrl: 'old.png' } }),
      );
    useReviewStore
      .getState()
      .addReview(
        'spot-b',
        makeReview({ id: 'r2', author: { id: 'user-taro', name: 'Taro', iconUrl: 'old.png' } }),
      );
    useReviewStore.getState().addReview(
      'spot-a',
      makeReview({
        id: 'r3',
        author: { id: 'user-hanako', name: 'Hanako', iconUrl: 'hanako.png' },
      }),
    );

    useReviewStore.getState().updateAuthorInfo('user-taro', { name: '新太郎', iconUrl: 'new.png' });

    const { submittedReviews } = useReviewStore.getState();
    expect(submittedReviews['spot-a'].find((r) => r.id === 'r1')?.author).toEqual({
      id: 'user-taro',
      name: '新太郎',
      iconUrl: 'new.png',
    });
    expect(submittedReviews['spot-b'].find((r) => r.id === 'r2')?.author).toEqual({
      id: 'user-taro',
      name: '新太郎',
      iconUrl: 'new.png',
    });
    expect(submittedReviews['spot-a'].find((r) => r.id === 'r3')?.author).toEqual({
      id: 'user-hanako',
      name: 'Hanako',
      iconUrl: 'hanako.png',
    });
  });
});
