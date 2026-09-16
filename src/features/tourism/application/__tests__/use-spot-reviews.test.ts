import { mergeReviews } from '../use-spot-reviews';

import type { Review } from '../../domain/review';

function review(id: string, postedAt: string): Review {
  return {
    id,
    rating: { value: 5 },
    comment: id,
    author: { id: 'author-n', name: 'n', iconUrl: 'https://example.com/a.png' },
    postedAt,
    language: 'ja',
  };
}

describe('mergeReviews', () => {
  it('seed と投稿を結合し、投稿日時の新しい順に並べる', () => {
    const seed = [review('a', '2025-01-01T00:00:00.000Z'), review('b', '2025-03-01T00:00:00.000Z')];
    const submitted = [review('c', '2026-06-29T00:00:00.000Z')];

    expect(mergeReviews(seed, submitted).map((r) => r.id)).toEqual(['c', 'b', 'a']);
  });

  it('空同士なら空配列を返す', () => {
    expect(mergeReviews([], [])).toEqual([]);
  });

  it('seed と submitted に同じ ID があっても重複させない（投稿・編集の再取得後）', () => {
    const posted = review('server-1', '2026-09-04T00:00:00.000Z');
    const seed = [review('a', '2025-01-01T00:00:00.000Z'), posted];

    expect(mergeReviews(seed, [posted]).map((r) => r.id)).toEqual(['server-1', 'a']);
  });

  it('同じ ID なら submitted 側の内容を優先する（編集直後の反映）', () => {
    const seed = [review('server-1', '2026-09-04T00:00:00.000Z')];
    const edited = { ...review('server-1', '2026-09-04T00:00:00.000Z'), comment: '編集後' };

    expect(mergeReviews(seed, [edited])[0].comment).toBe('編集後');
  });
});
