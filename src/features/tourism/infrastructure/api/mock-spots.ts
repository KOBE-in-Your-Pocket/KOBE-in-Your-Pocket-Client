import { FALLBACK_LANGUAGE, type SupportedLanguage } from '@/shared/lib/i18n';
import { buildSpotImageUrl } from '@/shared/config/spot-image';

import type { Spot } from '../../domain/spot';

import {
  MOCK_SPOT_LOCALIZATIONS,
  type MockSpotId,
  type SpotLocalization,
} from './mock-spot-localizations';

type MockSpotBase = Omit<
  Spot,
  'name' | 'description' | 'address' | 'businessHours' | 'category'
> & {
  id: MockSpotId;
};

/** S3 にアップロード済みのスポット（未アップロードは Unsplash にフォールバック）。 */
const S3_SPOT_IMAGE_FILES: Partial<Record<MockSpotId, string>> = {
  'kobe-port-tower': 'main.webp',
  'kitano-ijinkan': 'main.webp',
  nankinmachi: 'main.webp',
  'arima-onsen': 'main.webp',
  'mount-rokko': 'main.webp',
};

const FALLBACK_SPOT_IMAGE_URLS: Record<MockSpotId, string> = {
  'kobe-port-tower':
    'https://images.unsplash.com/photo-1570091160392-39f6a6596f46?auto=format&fit=crop&w=800&q=80',
  'kitano-ijinkan':
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  nankinmachi:
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80',
  'arima-onsen':
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  'mount-rokko':
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
};

function resolveSpotImageUrl(spotId: MockSpotId): string {
  const s3Filename = S3_SPOT_IMAGE_FILES[spotId];
  if (s3Filename) {
    const s3Url = buildSpotImageUrl(spotId, s3Filename);
    if (s3Url) {
      return s3Url;
    }
  }

  return FALLBACK_SPOT_IMAGE_URLS[spotId];
}

/**
 * mock の観光スポット一覧（神戸の代表的な名所）。
 * 言語依存の文言は {@link MOCK_SPOT_LOCALIZATIONS} で管理する。
 */
const MOCK_SPOT_BASES: MockSpotBase[] = [
  {
    id: 'kobe-port-tower',
    genre: 'landmark',
    media: {
      imageUrl: resolveSpotImageUrl('kobe-port-tower'),
    },
    coordinates: { latitude: 34.6826, longitude: 135.1863 },
  },
  {
    id: 'kitano-ijinkan',
    genre: 'history',
    media: {
      imageUrl: resolveSpotImageUrl('kitano-ijinkan'),
    },
    coordinates: { latitude: 34.6989, longitude: 135.1896 },
  },
  {
    id: 'nankinmachi',
    genre: 'gourmet',
    media: {
      imageUrl: resolveSpotImageUrl('nankinmachi'),
    },
    coordinates: { latitude: 34.6889, longitude: 135.1877 },
  },
  {
    id: 'arima-onsen',
    genre: 'onsen',
    media: {
      imageUrl: resolveSpotImageUrl('arima-onsen'),
    },
    coordinates: { latitude: 34.7956, longitude: 135.2468 },
  },
  {
    id: 'mount-rokko',
    genre: 'nature',
    media: {
      imageUrl: resolveSpotImageUrl('mount-rokko'),
    },
    coordinates: { latitude: 34.7488, longitude: 135.2231 },
  },
];

/** mock fetcher が模すネットワーク遅延（ミリ秒）。 */
const MOCK_LATENCY_MS = 300;

function resolveLocalization(language: SupportedLanguage, spotId: MockSpotId): SpotLocalization {
  return (
    MOCK_SPOT_LOCALIZATIONS[language]?.[spotId] ??
    MOCK_SPOT_LOCALIZATIONS[FALLBACK_LANGUAGE][spotId]
  );
}

function buildSpot(base: MockSpotBase, language: SupportedLanguage): Spot {
  const localized = resolveLocalization(language, base.id);

  return {
    ...base,
    name: localized.name,
    description: localized.description,
    address: localized.address,
    businessHours: localized.businessHours,
    category: { label: localized.categoryLabel },
    coordinates: { ...base.coordinates },
    media: { ...base.media },
    rating: base.rating ? { ...base.rating } : undefined,
  };
}

function cloneSpot(spot: Spot): Spot {
  return {
    ...spot,
    coordinates: { ...spot.coordinates },
    category: { ...spot.category },
    media: { ...spot.media },
    rating: spot.rating ? { ...spot.rating } : undefined,
  };
}

/**
 * 観光スポット一覧を取得する。
 *
 * 現状は mock データを返すが、Sprint 2 で実 REST API 呼び出しに差し替える。
 * その際もこの `fetchSpots(language): Promise<Spot[]>` というシグネチャを維持することで、
 * application / ui 層を変更せずに実装だけを入れ替えられる。
 */
export async function fetchSpots(language: SupportedLanguage = FALLBACK_LANGUAGE): Promise<Spot[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  return MOCK_SPOT_BASES.map((base) => cloneSpot(buildSpot(base, language)));
}

/**
 * 指定 ID の観光スポットを取得する。該当が無ければ null を返す。
 *
 * `fetchSpots` と同様、実 REST API 導入後もこのシグネチャを維持する。
 */
export async function fetchSpotById(
  id: string,
  language: SupportedLanguage = FALLBACK_LANGUAGE,
): Promise<Spot | null> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const base = MOCK_SPOT_BASES.find((spot) => spot.id === id);
  if (!base) {
    return null;
  }

  return cloneSpot(buildSpot(base, language));
}
