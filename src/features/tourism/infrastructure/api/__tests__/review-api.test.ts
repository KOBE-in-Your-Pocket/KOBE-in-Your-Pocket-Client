import { apiFetch } from '@/shared/lib/api';

import { fetchReviews, postReview, updateReview } from '../review-api';

jest.mock('@/shared/lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);

/** Backend レスポンス（author は name のみ返す想定）の 1 件を組み立てる。 */
function response(author: { name: string; id?: string | null; iconUrl?: string | null }) {
  return {
    id: 'r1',
    rating: { value: 4 },
    comment: 'コメント',
    author,
    postedAt: '2025-05-01T00:00:00.000Z',
    language: 'ja',
  };
}

describe('fetchReviews', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('encodeURIComponent したパスと lang クエリで apiFetch を呼ぶ', async () => {
    mockApiFetch.mockResolvedValue([]);

    await fetchReviews('spot/with space', 'en');

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/tourism/spots/spot%2Fwith%20space/reviews', {
      query: { lang: 'en' },
    });
  });

  it('author が name のみのとき id / iconUrl をフォールバック（空文字）で補う', async () => {
    mockApiFetch.mockResolvedValue([response({ name: '山田 太郎' })]);

    const [review] = await fetchReviews('nankinmachi', 'ja');

    expect(review.author).toEqual({ id: '', name: '山田 太郎', iconUrl: '' });
  });

  it('backend が id / iconUrl を返す場合はその値をそのまま採用する', async () => {
    mockApiFetch.mockResolvedValue([
      response({ name: '花子', id: 'user-9', iconUrl: 'https://example.com/a.png' }),
    ]);

    const [review] = await fetchReviews('nankinmachi', 'ja');

    expect(review.author).toEqual({
      id: 'user-9',
      name: '花子',
      iconUrl: 'https://example.com/a.png',
    });
  });

  it('id / iconUrl が null のときもフォールバックする', async () => {
    mockApiFetch.mockResolvedValue([response({ name: '次郎', id: null, iconUrl: null })]);

    const [review] = await fetchReviews('nankinmachi', 'ja');

    expect(review.author).toEqual({ id: '', name: '次郎', iconUrl: '' });
  });

  it('author 以外のフィールドは変換せずそのまま保持する', async () => {
    mockApiFetch.mockResolvedValue([response({ name: '太郎' })]);

    const [review] = await fetchReviews('nankinmachi', 'ja');

    expect(review).toMatchObject({
      id: 'r1',
      rating: { value: 4 },
      comment: 'コメント',
      postedAt: '2025-05-01T00:00:00.000Z',
      language: 'ja',
    });
  });
});

const AUTHOR = { id: 'user-arakawa', name: '荒川蓮', iconUrl: 'https://i.pravatar.cc/150?img=68' };
const INPUT = { rating: { value: 4 }, comment: 'コメント', language: 'ja' } as const;

describe('postReview', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue(response({ name: '荒川蓮' }));
  });

  it('認証付きで POST し、rating は数値・author は名前とアイコンで送る', async () => {
    await postReview('nankinmachi', INPUT, AUTHOR);

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/tourism/spots/nankinmachi/reviews', {
      method: 'POST',
      auth: true,
      body: {
        rating: 4,
        comment: 'コメント',
        author: { name: '荒川蓮', iconUrl: 'https://i.pravatar.cc/150?img=68' },
        language: 'ja',
      },
    });
  });

  it('spotId を URL エンコードする', async () => {
    await postReview('spot/with space', INPUT, AUTHOR);

    expect(mockApiFetch.mock.calls[0][0]).toBe('/api/v1/tourism/spots/spot%2Fwith%20space/reviews');
  });

  it('アイコン未設定の投稿者は iconUrl を null で送る', async () => {
    await postReview('nankinmachi', INPUT, { ...AUTHOR, iconUrl: '' });

    expect(mockApiFetch.mock.calls[0][1]).toMatchObject({
      body: { author: { name: '荒川蓮', iconUrl: null } },
    });
  });

  it('author.id は backend が返さないためログイン中のユーザーの ID で補う', async () => {
    const review = await postReview('nankinmachi', INPUT, AUTHOR);

    expect(review.author.id).toBe('user-arakawa');
  });

  it('backend がアイコンを返さない場合はログイン中のユーザーのアイコンにフォールバックする', async () => {
    mockApiFetch.mockResolvedValue(response({ name: '荒川蓮', iconUrl: null }));

    const review = await postReview('nankinmachi', INPUT, AUTHOR);

    expect(review.author.iconUrl).toBe('https://i.pravatar.cc/150?img=68');
  });

  it('backend がアイコンを返す場合はその値を採用する', async () => {
    mockApiFetch.mockResolvedValue(
      response({ name: '荒川蓮', iconUrl: 'https://cdn.example.com/icon.png' }),
    );

    const review = await postReview('nankinmachi', INPUT, AUTHOR);

    expect(review.author.iconUrl).toBe('https://cdn.example.com/icon.png');
  });

  it('author 以外のフィールドはサーバーの値をそのまま採用する', async () => {
    const review = await postReview('nankinmachi', INPUT, AUTHOR);

    expect(review).toMatchObject({
      id: 'r1',
      rating: { value: 4 },
      comment: 'コメント',
      postedAt: '2025-05-01T00:00:00.000Z',
      language: 'ja',
    });
  });
});

describe('updateReview', () => {
  const CHANGES = { rating: { value: 5 }, comment: '編集後のコメント' };

  beforeEach(() => {
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue(response({ name: '荒川蓮' }));
  });

  it('認証付きで PUT し、rating と comment だけを送る（language は送らない）', async () => {
    await updateReview('nankinmachi', 'review-1', CHANGES, AUTHOR);

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/v1/tourism/spots/nankinmachi/reviews/review-1',
      {
        method: 'PUT',
        auth: true,
        body: { rating: 5, comment: '編集後のコメント' },
      },
    );
  });

  it('spotId と reviewId を URL エンコードする', async () => {
    await updateReview('spot/with space', 'review/1', CHANGES, AUTHOR);

    expect(mockApiFetch.mock.calls[0][0]).toBe(
      '/api/v1/tourism/spots/spot%2Fwith%20space/reviews/review%2F1',
    );
  });

  it('author.id は backend が返さないためログイン中のユーザーの ID で補う', async () => {
    const review = await updateReview('nankinmachi', 'review-1', CHANGES, AUTHOR);

    expect(review.author.id).toBe('user-arakawa');
  });

  it('backend がアイコンを返さない場合はログイン中のユーザーのアイコンにフォールバックする', async () => {
    mockApiFetch.mockResolvedValue(response({ name: '荒川蓮', iconUrl: null }));

    const review = await updateReview('nankinmachi', 'review-1', CHANGES, AUTHOR);

    expect(review.author.iconUrl).toBe('https://i.pravatar.cc/150?img=68');
  });

  it('author 以外のフィールドはサーバーの値をそのまま採用する', async () => {
    const review = await updateReview('nankinmachi', 'review-1', CHANGES, AUTHOR);

    expect(review).toMatchObject({
      id: 'r1',
      rating: { value: 4 },
      comment: 'コメント',
      postedAt: '2025-05-01T00:00:00.000Z',
      language: 'ja',
    });
  });
});
