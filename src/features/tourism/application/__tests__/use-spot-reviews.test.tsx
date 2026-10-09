import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { fetchReviews } from '../../infrastructure/api/review-api';
import { applyCurrentUserAuthorInfo, mergeReviews, useSpotReviews } from '../use-spot-reviews';

import type { PropsWithChildren } from 'react';

import type { Review } from '../../domain/review';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ja' } }),
}));

jest.mock('../../infrastructure/api/review-api', () => ({
  fetchReviews: jest.fn(),
}));

const fetchReviewsMock = fetchReviews as jest.Mock;

function review(id: string, postedAt: string, author?: Partial<Review['author']>): Review {
  return {
    id,
    rating: { value: 5 },
    comment: id,
    author: { id: 'author-n', name: 'n', iconUrl: 'https://example.com/a.png', ...author },
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

  it('hiddenReviewIds のレビューは submitted（本人の投稿）にあっても除く', () => {
    const own = review('own-1', '2026-09-04T00:00:00.000Z');
    const seed = [review('a', '2025-01-01T00:00:00.000Z')];

    expect(mergeReviews(seed, [own], ['own-1']).map((r) => r.id)).toEqual(['a']);
  });
});

describe('applyCurrentUserAuthorInfo', () => {
  const currentUser: Review['author'] = {
    id: 'user-1',
    name: '新しい名前',
    iconUrl: 'https://example.com/new.png',
  };

  it('自分（author.id 一致）のレビューは今のプロフィールの name / iconUrl に差し替わる', () => {
    const own = review('r1', '2026-09-04T00:00:00.000Z', {
      id: 'user-1',
      name: '古い名前',
      iconUrl: 'https://example.com/old.png',
    });

    const [result] = applyCurrentUserAuthorInfo([own], currentUser);

    expect(result.author).toEqual({
      id: 'user-1',
      name: '新しい名前',
      iconUrl: 'https://example.com/new.png',
    });
  });

  it('他人のレビューは変わらない', () => {
    const other = review('r1', '2026-09-04T00:00:00.000Z');

    const [result] = applyCurrentUserAuthorInfo([other], currentUser);

    expect(result.author).toEqual(other.author);
  });

  it('未ログイン（currentUser が null）なら何も変えない', () => {
    const own = review('r1', '2026-09-04T00:00:00.000Z', { id: 'user-1' });

    const [result] = applyCurrentUserAuthorInfo([own], null);

    expect(result.author).toEqual(own.author);
  });

  it('author.id が空文字（V17 以前の投稿）は差し替えない', () => {
    const legacy = review('r1', '2026-09-04T00:00:00.000Z', { id: '' });
    const anonymousUser: Review['author'] = { id: '', name: '匿名', iconUrl: '' };

    const [result] = applyCurrentUserAuthorInfo([legacy], anonymousUser);

    expect(result.author).toEqual(legacy.author);
  });
});

/**
 * gcTime を 0 にするのは、キャッシュ回収のタイマーがテスト終了後も残って
 * jest がプロセスを終了できなくなるのを防ぐため。
 */
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return wrapper;
}

describe('useSpotReviews', () => {
  const OWN_REVIEW: Review = {
    id: 'review-1',
    rating: { value: 5 },
    comment: '最高でした',
    author: { id: 'user-1', name: '古い名前', iconUrl: 'https://example.com/old.png' },
    postedAt: '2026-09-01T00:00:00.000Z',
    language: 'ja',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchReviewsMock.mockResolvedValue({ reviews: [OWN_REVIEW], hiddenReviewIds: [] });
  });

  it('currentUser の変更だけで（再取得せずに）自分のレビュー表示が更新される', async () => {
    const wrapper = createWrapper();
    const { result, rerender } = renderHook<
      ReturnType<typeof useSpotReviews>,
      { currentUser: Review['author'] | null }
    >(({ currentUser }) => useSpotReviews('spot-a', currentUser), {
      wrapper,
      initialProps: { currentUser: null },
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data[0]?.author.name).toBe('古い名前');

    rerender({
      currentUser: { id: 'user-1', name: '新しい名前', iconUrl: 'https://example.com/new.png' },
    });

    expect(result.current.data[0]?.author).toEqual({
      id: 'user-1',
      name: '新しい名前',
      iconUrl: 'https://example.com/new.png',
    });
    expect(fetchReviewsMock).toHaveBeenCalledTimes(1);
  });

  it('他人のレビューは currentUser が変わっても変わらない', async () => {
    const wrapper = createWrapper();
    const { result, rerender } = renderHook<
      ReturnType<typeof useSpotReviews>,
      { currentUser: Review['author'] | null }
    >(({ currentUser }) => useSpotReviews('spot-a', currentUser), {
      wrapper,
      initialProps: { currentUser: null },
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    rerender({
      currentUser: { id: 'other-user', name: '別の人', iconUrl: 'https://example.com/other.png' },
    });

    expect(result.current.data[0]?.author).toEqual(OWN_REVIEW.author);
  });
});
