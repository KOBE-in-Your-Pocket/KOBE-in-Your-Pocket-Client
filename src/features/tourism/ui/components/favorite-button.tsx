import { Image } from 'expo-image';
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

// お気に入り済み＝塗りつぶし、未登録＝枠線のハート。白いシルエットを tintColor で着色する。
// iOS の SF Symbols（heart.fill / heart）では塗りつぶせるが、Android・web が使う
// Material Symbols の静的フォントは favorite と favorite_border を同じ枠線グリフとして描くため
// 塗りつぶせない（#824）。全プラットフォームで確実に塗りつぶしを出すため PNG を使う。
const FILLED_HEART = require('@/assets/images/favorites/heart-filled.png');
const OUTLINED_HEART = require('@/assets/images/favorites/heart-outline.png');

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
      <Image
        testID="favorite-icon"
        source={isFavorite ? FILLED_HEART : OUTLINED_HEART}
        tintColor={isFavorite ? FAVORITE_ACTIVE_COLOR : inactiveColor}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Pressable>
  );
}
