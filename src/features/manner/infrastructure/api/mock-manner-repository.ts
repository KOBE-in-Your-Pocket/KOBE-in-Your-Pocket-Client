import type { MannerRepository } from '../../domain/manner-repository';

import { fetchMannerById, fetchManners } from './mock-manners';

/** mock fetcher を {@link MannerRepository} として公開する。実 API 差し替え時はこの実装だけを入れ替える。 */
export function createMockMannerRepository(): MannerRepository {
  return {
    findAll: fetchManners,
    findById: fetchMannerById,
  };
}
