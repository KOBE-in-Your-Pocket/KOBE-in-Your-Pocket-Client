import type { MannerItem } from '../../../domain/manner-item';

import { getSpotManners } from '../get-spot-manners';

function manner(id: string, relatedSpotIds: string[]): MannerItem {
  return {
    id,
    title: id,
    description: id,
    icon: id,
    imageKey: null,
    kind: 'manner',
    scope: 'local',
    relatedSpotIds,
  };
}

describe('getSpotManners', () => {
  const manners = [
    manner('a', ['nankinmachi']),
    manner('b', ['nankinmachi', 'kitano-ijinkan']),
    manner('c', []),
    manner('d', ['kitano-ijinkan']),
  ];

  it('relatedSpotIds に spotId を含む項目だけを返す', () => {
    expect(getSpotManners('nankinmachi', manners).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('該当が無ければ空配列を返す', () => {
    expect(getSpotManners('unknown-spot', manners)).toEqual([]);
  });
});
