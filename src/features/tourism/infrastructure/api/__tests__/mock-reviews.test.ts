import { fetchReviews } from '../mock-reviews';
import { fetchSpots } from '../mock-spots';

describe('fetchReviews', () => {
  it('指定スポットのレビューを返す', async () => {
    const reviews = await fetchReviews('kobe-port-tower');

    expect(reviews.length).toBeGreaterThan(0);
  });

  it('一覧の全スポットがレビューを持つ', async () => {
    const spots = await fetchSpots('ja');

    for (const spot of spots) {
      const reviews = await fetchReviews(spot.id);
      expect(reviews.length).toBeGreaterThan(0);
    }
  });

  it('各レビューは投稿時の言語で固定されている', async () => {
    const reviews = await fetchReviews('kobe-port-tower');

    expect(reviews[0]?.language).toBe('ja');
    expect(reviews[0]?.author.name).toBe('山田 健太');
    expect(reviews[1]?.language).toBe('en');
    expect(reviews[1]?.author.name).toBe('Misaki Sato');
  });

  it('スポットによって異なる言語のレビューが混在する', async () => {
    const reviews = await fetchReviews('kitano-ijinkan');

    expect(reviews[0]?.language).toBe('ko');
    expect(reviews[1]?.language).toBe('zh');
  });

  it('呼び出しごとに独立したオブジェクトを返す', async () => {
    const first = await fetchReviews('kobe-port-tower');
    const second = await fetchReviews('kobe-port-tower');

    expect(first[0]).not.toBe(second[0]);

    first[0].author.name = 'mutated';
    expect(second[0]?.author.name).not.toBe('mutated');
  });

  it('各レビューは表示に必要なフィールドを持つ', async () => {
    const reviews = await fetchReviews('nankinmachi');

    for (const review of reviews) {
      expect(review.rating.value).toBeGreaterThanOrEqual(1);
      expect(review.rating.value).toBeLessThanOrEqual(5);
      expect(review.comment).toBeTruthy();
      expect(review.author.name).toBeTruthy();
      expect(review.author.iconUrl).toMatch(/^https?:\/\//);
      expect(Number.isNaN(Date.parse(review.postedAt))).toBe(false);
      expect(review.language).toBeTruthy();
    }
  });

  it('未知のスポット ID には空配列を返す', async () => {
    const reviews = await fetchReviews('unknown-spot');

    expect(reviews).toEqual([]);
  });
});
