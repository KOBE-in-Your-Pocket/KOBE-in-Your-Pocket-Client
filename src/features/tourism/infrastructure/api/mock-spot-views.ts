import type { SpotViewRepository } from '../../domain/spot-view';

/** 通信している感じを出す遅延。閲覧の記録が画面の動きを待たせないことを実機で確かめやすくする。 */
const MOCK_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 300;

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

export type MockSpotViewRepository = SpotViewRepository & {
  /** 記録された閲覧数（記録が無ければ 0）。閲覧数の表示（#836）とテストで使う。 */
  getViewCount(spotId: string): number;
};

/**
 * backend の閲覧数 API（backend#240）ができるまで使うメモリ上のモック（#834）。
 *
 * 実 API と同じく未ログインでも数えられる。データはアプリを動かしている間だけ残る。
 * どの実装を使うかは composition root（`src/app/_layout.tsx`）で決める。実 API への切り替えは #837 で行う。
 */
export function createMockSpotViewRepository(): MockSpotViewRepository {
  /** spotId → 閲覧数。 */
  const viewCounts = new Map<string, number>();

  return {
    recordSpotView: async (spotId) => {
      await wait();
      viewCounts.set(spotId, (viewCounts.get(spotId) ?? 0) + 1);
    },
    getViewCount: (spotId) => viewCounts.get(spotId) ?? 0,
  };
}
