import type { MannerRepository } from '../../domain/manner-repository';

import { fetchMannerById, fetchManners } from './manner-api';

/** backend の実 API を {@link MannerRepository} として公開する（#412）。 */
export function createApiMannerRepository(): MannerRepository {
  return {
    findAll: fetchManners,
    findById: fetchMannerById,
  };
}
