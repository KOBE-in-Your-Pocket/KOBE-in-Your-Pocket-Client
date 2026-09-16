import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { MannerItem } from '../../domain/manner-item';
import type { MannerRepository } from '../../domain/manner-repository';

/**
 * 指定言語のマナー項目一覧を取得するユースケース。
 *
 * domain の {@link MannerRepository} 経由でデータを取得する。
 * 具体実装の選択は呼び出し側（composition 層）の責務とする。
 */
export async function getManners(
  language: SupportedLanguage,
  repository: MannerRepository,
): Promise<MannerItem[]> {
  return repository.findAll(language);
}
