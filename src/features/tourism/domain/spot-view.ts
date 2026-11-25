/**
 * 観光スポットの閲覧（詳細画面への遷移）を数える形（#777）。
 *
 * 実装は backend の API（backend#240）を呼ぶ `infrastructure/api/api-spot-view-repository.ts`（#837）。
 * 未ログインでも数えられる。重複・連打をどう数えるかは backend 側で決める（backend#242）ので、
 * クライアントは遷移のたびに 1 回呼ぶだけにする。
 */
export type SpotViewRepository = {
  recordSpotView(spotId: string): Promise<void>;
};
