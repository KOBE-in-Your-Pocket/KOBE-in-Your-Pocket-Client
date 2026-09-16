import { Image } from 'expo-image';

import type { MannerItem } from '../../domain/manner-item';

import { MannerIcon } from './manner-icon';
import { MANNER_PICTOGRAM_MAP } from './manner-pictogram-map';

/**
 * MannerItem 用のピクトグラム画像。
 * `imageKey` に対応する画像が無い場合は既存の {@link MannerIcon} にフォールバックする。
 */
export function MannerPictogram({
  manner,
  size = 40,
}: {
  manner: Pick<MannerItem, 'icon' | 'imageKey'>;
  size?: number;
}) {
  const { imageKey } = manner;
  const source =
    imageKey !== null && Object.hasOwn(MANNER_PICTOGRAM_MAP, imageKey)
      ? MANNER_PICTOGRAM_MAP[imageKey]
      : undefined;

  if (!source) {
    return <MannerIcon icon={manner.icon} size={Math.round(size * 0.55)} />;
  }

  return (
    <Image
      source={source}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
    />
  );
}
