import type { EvacuationShelter } from '../../domain/evacuation-shelter';

/** mock fetcher が模すネットワーク遅延（ミリ秒）。 */
const MOCK_LATENCY_MS = 300;

/** mock の避難所一覧（神戸市内の代表的な公共施設・学校・公園）。 */
const MOCK_SHELTERS: EvacuationShelter[] = [
  {
    id: 'kobe-city-hall',
    name: '神戸市役所',
    address: '兵庫県神戸市中央区加納町6丁目5-1',
    coordinates: { latitude: 34.6909, longitude: 135.1956 },
    type: 'designated',
    facilityCategory: 'government',
    media: {
      imageUrl:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    },
    capacity: 850,
    accessible: true,
    externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
  },
  {
    id: 'sannomiya-elementary',
    name: '三宮小学校',
    address: '兵庫県神戸市中央区北長狭通2丁目1-3',
    coordinates: { latitude: 34.6952, longitude: 135.1934 },
    type: 'designated',
    facilityCategory: 'school',
    media: {
      imageUrl:
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    },
    capacity: 420,
    accessible: true,
    externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
  },
  {
    id: 'higashi-yuenchi',
    name: '東遊園地',
    address: '兵庫県神戸市中央区加納町6丁目4',
    coordinates: { latitude: 34.6905, longitude: 135.1958 },
    type: 'emergency',
    facilityCategory: 'park',
    media: {
      imageUrl:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    },
    capacity: 8000,
    accessible: false,
    externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
  },
  {
    id: 'kobe-central-gymnasium',
    name: '神戸市立中央体育館',
    address: '兵庫県神戸市中央区楠町4丁目1-1',
    coordinates: { latitude: 34.6841, longitude: 135.1772 },
    type: 'designated',
    facilityCategory: 'gymnasium',
    media: {
      imageUrl:
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80',
    },
    capacity: 1200,
    accessible: true,
    externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
  },
  {
    id: 'oji-park',
    name: '王子公園',
    address: '兵庫県神戸市灘区王子町3丁目1',
    coordinates: { latitude: 34.7126, longitude: 135.2125 },
    type: 'both',
    facilityCategory: 'park',
    media: {
      imageUrl:
        'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    },
    capacity: 5000,
    accessible: false,
    externalUrl: 'https://www.city.kobe.lg.jp/bosai/',
  },
  {
    id: 'minatogawa-park',
    name: '湊川公園',
    address: '兵庫県神戸市兵庫区荒田町1丁目',
    coordinates: { latitude: 34.679, longitude: 135.1668 },
    type: 'both',
    facilityCategory: 'park',
    media: {
      imageUrl:
        'https://images.unsplash.com/photo-1473448911418-99689ee1967a?auto=format&fit=crop&w=800&q=80',
    },
    capacity: 3000,
    accessible: true,
  },
];

function cloneShelter(shelter: EvacuationShelter): EvacuationShelter {
  return {
    ...shelter,
    coordinates: { ...shelter.coordinates },
    media: { ...shelter.media },
  };
}

/**
 * 避難所一覧を取得する。
 * 実 API / ローカル DB 導入後もこのシグネチャを維持し、application / ui 層を変更せずに差し替える。
 */
export async function fetchEvacuationShelters(): Promise<EvacuationShelter[]> {
  await new Promise<void>((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  return MOCK_SHELTERS.map(cloneShelter);
}
