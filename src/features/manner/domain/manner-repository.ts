import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { MannerItem } from './manner-item';

export type MannerRepository = {
  findAll(language: SupportedLanguage): Promise<MannerItem[]>;
  findById(id: string, language: SupportedLanguage): Promise<MannerItem | null>;
};
