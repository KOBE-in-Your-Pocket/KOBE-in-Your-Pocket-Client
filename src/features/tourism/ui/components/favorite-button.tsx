import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { useTheme } from '@/shared/lib/theme';

import {
  FAVORITE_ACTIVE_COLOR,
  FAVORITE_OVERLAY_INACTIVE_COLOR,
  OVERLAY_PADDING,
  styles,
  touchHitSlop,
} from '../styles/favorite-button.styles';

export type FavoriteButtonVariant = 'overlay' | 'plain';

export type FavoriteButtonProps = {
  isFavorite: boolean;
  onPress: () => void;
  /** overlay：画像の上（白いアイコン＋半透明の丸）／ plain：カードの地の上。既定は plain。 */
  variant?: FavoriteButtonVariant;
  /** アイコンの大きさ。overlay の丸はこれに余白を足した大きさになる。既定は 16。 */
  size?: number;
};

const DEFAULT_ICON_SIZE = 16;

// Android・web は Material Symbols。favorite と favorite_border の形がフォントによって
// 同じに見えても状態がわかるよう、色でも区別する。
const FILLED_HEART = { ios: 'heart.fill', android: 'favorite', web: 'favorite' } as const;
const OUTLINED_HEART = {
  ios: 'heart',
  android: 'favorite_border',
  web: 'favorite_border',
} as const;

/**
 * お気に入りマーク（#791）。見た目と押したときの反応だけを持ち、状態は呼び出し側が渡す。
 *
 * 各画面には、お気に入りの状態とつないだ `SpotFavoriteButton` を置く。
 */
export function FavoriteButton({
  isFavorite,
  onPress,
  variant = 'plain',
  size = DEFAULT_ICON_SIZE,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const inactiveColor =
    variant === 'overlay' ? FAVORITE_OVERLAY_INACTIVE_COLOR : theme.textSecondary;
  // overlay は 16 + 余白 6×2 = 28 で、スポットカードの閉じるボタンと同じ大きさになる。
  const visualSize = variant === 'overlay' ? size + OVERLAY_PADDING * 2 : size;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={touchHitSlop(visualSize)}
      style={({ pressed }) => [
        styles.base,
        variant === 'overlay' && styles.overlay,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={t(isFavorite ? 'tourism.favorite.remove' : 'tourism.favorite.add')}
    >
      <SymbolView
        name={isFavorite ? FILLED_HEART : OUTLINED_HEART}
        tintColor={isFavorite ? FAVORITE_ACTIVE_COLOR : inactiveColor}
        size={size}
      />
    </Pressable>
  );
}
