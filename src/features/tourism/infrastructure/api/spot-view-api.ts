import type { SpotViewRepository } from '../../domain/spot-view';

import { mockSpotViewRepository } from './mock-spot-views';

/**
 * 観光スポットの閲覧を数える（#777）。application 層はこのファイルだけを見る。
 *
 * backend の API（`POST /api/v1/tourism/spots/{spotId}/views`、backend#240）ができるまではモックを使う（#834）。
 * 実 API への切り替え（#837）は、このファイルの中身を差し替えるだけで済むようにしている。
 */
const repository: SpotViewRepository = mockSpotViewRepository;

export const recordSpotView = (spotId: string) => repository.recordSpotView(spotId);
