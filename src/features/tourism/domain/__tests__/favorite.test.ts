import { joinFavoriteSpots } from '../favorite';

const spotA = { id: 'spot-a', name: 'A' };
const spotB = { id: 'spot-b', name: 'B' };
const spotC = { id: 'spot-c', name: 'C' };

describe('joinFavoriteSpots', () => {
  it('お気に入りの spotId にスポットを引き当て、登録の新しい順に並べる', () => {
    const favorites = [
      { spotId: 'spot-b', createdAt: '2026-11-01T00:00:00.000Z' },
      { spotId: 'spot-c', createdAt: '2026-11-03T00:00:00.000Z' },
      { spotId: 'spot-a', createdAt: '2026-11-02T00:00:00.000Z' },
    ];

    expect(joinFavoriteSpots(favorites, [spotA, spotB, spotC])).toEqual([spotC, spotA, spotB]);
  });

  it('スポット一覧に無い ID（非公開・削除済み）は捨てる', () => {
    const favorites = [
      { spotId: 'spot-gone', createdAt: '2026-11-03T00:00:00.000Z' },
      { spotId: 'spot-a', createdAt: '2026-11-02T00:00:00.000Z' },
    ];

    expect(joinFavoriteSpots(favorites, [spotA, spotB])).toEqual([spotA]);
  });

  it('お気に入りが無ければ空', () => {
    expect(joinFavoriteSpots([], [spotA])).toEqual([]);
  });

  it('渡したお気に入りの配列は並べ替えない', () => {
    const favorites = [
      { spotId: 'spot-a', createdAt: '2026-11-01T00:00:00.000Z' },
      { spotId: 'spot-b', createdAt: '2026-11-02T00:00:00.000Z' },
    ];

    joinFavoriteSpots(favorites, [spotA, spotB]);

    expect(favorites.map((favorite) => favorite.spotId)).toEqual(['spot-a', 'spot-b']);
  });
});
