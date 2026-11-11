import { useCurrentUser } from '@/features/user/application/use-current-user';
import { IS_USER_CONTENT_ENABLED } from '@/shared/config';
import { useIsAdult } from '@/shared/store';

import { useIsFavorite } from '../../application/use-favorites';
import { useToggleFavorite } from '../../application/use-toggle-favorite';

import { FavoriteButton, type FavoriteButtonVariant } from './favorite-button';

export type SpotFavoriteButtonProps = {
  spotId: string;
  variant?: FavoriteButtonVariant;
  size?: number;
};

/**
 * スポットのお気に入りマーク（#791）。マップのカード・観光一覧・観光詳細にはこれを置く。
 *
 * お気に入りの状態とつなぎ、押したら追加・削除する（失敗したらフックが見た目を元に戻す）。
 *
 * お気に入りはログインが前提なので、ログインの導線が無いとき（{@link IS_USER_CONTENT_ENABLED}
 * が false、または 18 歳未満）は表示しない。
 * 未ログインで押したときにログインを案内するのは #796 で足す。それまでは何もしない。
 */
export function SpotFavoriteButton({ spotId, variant, size }: SpotFavoriteButtonProps) {
  const currentUser = useCurrentUser();
  const isAdult = useIsAdult();
  const isFavorite = useIsFavorite(spotId);
  const toggleFavorite = useToggleFavorite();

  if (!IS_USER_CONTENT_ENABLED || !isAdult) {
    return null;
  }

  function handlePress() {
    if (!currentUser) return;
    toggleFavorite.mutate({ spotId, next: !isFavorite });
  }

  return (
    <FavoriteButton isFavorite={isFavorite} onPress={handlePress} variant={variant} size={size} />
  );
}
