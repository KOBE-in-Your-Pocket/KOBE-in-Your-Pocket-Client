/**
 * S3 上の観光スポット画像 URL を組み立てる。
 */
export function getS3ImageBaseUrl(): string | undefined {
  const base = process.env.EXPO_PUBLIC_S3_IMAGE_BASE_URL?.trim();
  if (!base) {
    return undefined;
  }

  return base.replace(/\/$/, '');
}

export function buildSpotImageUrl(spotId: string, filename = 'main.jpg'): string | undefined {
  const base = getS3ImageBaseUrl();
  if (!base) {
    return undefined;
  }

  return `${base}/spots/${spotId}/${filename}`;
}
