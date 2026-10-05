import { Image } from 'expo-image';
import { useState } from 'react';

import type { MannerItem } from '../../domain/manner-item';

import { MannerIcon } from './manner-icon';
import { MANNER_PICTOGRAM_MAP } from './manner-pictogram-map';

/**
 * MannerItem 用のピクトグラム画像。
 *
 * 表示の優先順:
 * 1. `iconUrl`（運営が管理画面からアップロードした画像）
 * 2. `imageKey` に対応する同梱画像
 * 3. 既存の {@link MannerIcon}
 *
 * `iconUrl` の読み込みに失敗した場合も 2 → 3 へフォールバックし、空白にはしない。
 */
export function MannerPictogram({
  manner,
  size = 40,
}: {
  manner: Pick<MannerItem, 'icon' | 'iconUrl' | 'imageKey'>;
  size?: number;
}) {
  const { iconUrl, imageKey } = manner;
  // 失敗した URL を覚えておき、別の URL に変わったら再び試す。
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (iconUrl !== null && iconUrl !== '' && iconUrl !== failedUrl) {
    return (
      <Image
        source={{ uri: iconUrl }}
        style={style}
        contentFit="cover"
        onError={() => setFailedUrl(iconUrl)}
      />
    );
  }

  const source =
    imageKey !== null && Object.hasOwn(MANNER_PICTOGRAM_MAP, imageKey)
      ? MANNER_PICTOGRAM_MAP[imageKey]
      : undefined;

  if (!source) {
    return <MannerIcon icon={manner.icon} size={Math.round(size * 0.55)} />;
  }

  return <Image source={source} style={style} contentFit="cover" />;
}
