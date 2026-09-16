import { apiFetch, ApiError } from '@/shared/lib/api';
import type { SupportedLanguage } from '@/shared/lib/i18n';

import type { Spot } from '../../domain/spot';

/**
 * 観光スポット一覧を取得する。
 *
 * バックエンド `GET /api/v1/tourism/spots` を呼び出し、指定言語で解決済みの
 * スポット一覧を返す。レスポンス形式はクライアント {@link Spot} 型と直接互換。
 */
export async function fetchSpots(language: SupportedLanguage): Promise<Spot[]> {
  return apiFetch<Spot[]>('/api/v1/tourism/spots', {
    query: { lang: language },
  });
}

/**
 * 指定 ID の観光スポットを取得する。該当が無ければ null を返す。
 *
 * バックエンド `GET /api/v1/tourism/spots/:id` を呼び出す。
 * 404 は正常な「見つからない」ケースとして null に変換する。
 */
export async function fetchSpotById(id: string, language: SupportedLanguage): Promise<Spot | null> {
  try {
    return await apiFetch<Spot>(`/api/v1/tourism/spots/${encodeURIComponent(id)}`, {
      query: { lang: language },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
