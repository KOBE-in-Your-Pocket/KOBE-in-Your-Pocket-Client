import { apiFetch } from '@/shared/lib/api';

import type { SpotViewRepository } from '../../domain/spot-view';

/**
 * backend の閲覧数 API（backend#240）で閲覧を記録する（#837）。
 *
 * `POST /api/v1/tourism/spots/{spotId}/views`。未ログインでも呼べる公開 API で、204 を返す。
 * トークンは付けない（`auth` を指定しない）。公開 API でも付けたトークンは検証されるため、
 * 期限切れのトークンを付けると 401 になってしまう（backend の docs/spot-view.md）。
 * 同じ IP × 同じスポットの重複は backend が 10 分に 1 回へまとめるので、クライアントは呼ぶだけにする。
 * 失敗（404・429 など）は `ApiError` のまま投げ、握りつぶすのは呼び出し側（useRecordSpotView）の役目。
 *
 * どの実装を使うかは composition root（`src/app/_layout.tsx`）で決める。
 */
export function createApiSpotViewRepository(): SpotViewRepository {
  return {
    recordSpotView: (spotId) =>
      apiFetch<void>(`/api/v1/tourism/spots/${encodeURIComponent(spotId)}/views`, {
        method: 'POST',
      }),
  };
}
