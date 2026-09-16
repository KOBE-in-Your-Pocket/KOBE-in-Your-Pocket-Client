import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { MannerItem } from '../../domain/manner-item';
import type { MannerRepository } from '../../domain/manner-repository';

/**
 * 指定 ID のマナー項目を取得するユースケース。
 *
 * domain の {@link MannerRepository} 経由で 1 件取得する。該当が無ければ null。
 * 具体実装の選択は呼び出し側（composition 層）の責務とする。
 */
export async function getMannerById(
  id: string,
  language: SupportedLanguage,
  repository: MannerRepository,
): Promise<MannerItem | null> {
  return repository.findById(id, language);
}
