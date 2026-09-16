import type { MannerItem } from '../../../domain/manner-item';
import type { MannerRepository } from '../../../domain/manner-repository';

import { getManners } from '../get-manners';

function createStubRepository(items: MannerItem[]): MannerRepository {
  return {
    findAll: async () => items,
    findById: async () => null,
  };
}

describe('getManners', () => {
  it('注入した repository.findAll の結果を返す', async () => {
    const items: MannerItem[] = [
      {
        id: 'test-manner',
        title: 'Test',
        description: 'Description',
        icon: 'test',
        imageKey: null,
        kind: 'manner',
        scope: 'local',
        relatedSpotIds: [],
      },
    ];

    const result = await getManners('ja', createStubRepository(items));

    expect(result).toEqual(items);
  });
});
