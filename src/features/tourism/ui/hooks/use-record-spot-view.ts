import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';

import { recordSpotView } from '../../application/record-spot-view';
import { useSpotViewRepository } from '../../application/spot-view-repository-context';

const RECORD_SPOT_VIEW_MUTATION_KEY = ['tourism', 'spot-view', 'record'] as const;

/**
 * 観光スポットの閲覧を 1 回数える関数を返す UI hook（#834）。
 *
 * {@link recordSpotView} ユースケースを useMutation でラップする。Repository 実装は
 * {@link SpotViewRepositoryProvider} 経由で注入されるため、ui 層は infrastructure を直接参照しない。
 *
 * カードから詳細画面に遷移するときに呼ぶ（#835）。閲覧数はおまけの情報なので、
 * 結果を待たずに投げっぱなしにし、失敗しても画面の操作は止めず、エラーも表示しない。
 * 再試行もしない（数え過ぎを避けるため。重複の扱いは backend#242 で決める）。
 */
export function useRecordSpotView(): (spotId: string) => void {
  const repository = useSpotViewRepository();
  const { mutate } = useMutation<void, Error, string>({
    mutationKey: RECORD_SPOT_VIEW_MUTATION_KEY,
    mutationFn: (spotId) => recordSpotView(spotId, repository),
    retry: false,
  });

  return useCallback((spotId: string) => mutate(spotId), [mutate]);
}
