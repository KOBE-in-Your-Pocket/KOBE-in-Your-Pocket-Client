import { SUPPORTED_LANGUAGES } from '@/shared/lib/i18n';

import { fetchSpotById, fetchSpots } from '../mock-spots';

describe('fetchSpots', () => {
  it('3〜5件の観光スポットを返す', async () => {
    const spots = await fetchSpots('ja');

    expect(spots.length).toBeGreaterThanOrEqual(3);
    expect(spots.length).toBeLessThanOrEqual(5);
  });

  it('各スポットは一覧表示に必要なフィールドを持つ', async () => {
    const spots = await fetchSpots('ja');

    for (const spot of spots) {
      expect(spot.id).toBeTruthy();
      expect(spot.name).toBeTruthy();
      expect(spot.genre).toBeTruthy();
      expect(spot.category.label).toBeTruthy();
      expect(spot.description).toBeTruthy();
      expect(spot.address).toBeTruthy();
      expect(spot.media.imageUrl).toMatch(/^https?:\/\//);
      expect(spot.coordinates.latitude).toBeDefined();
      expect(spot.coordinates.longitude).toBeDefined();
      // rating は任意。データがあれば妥当な範囲に収まること（無ければ UI 非表示）。
      if (spot.rating) {
        expect(spot.rating.value).toBeGreaterThan(0);
        expect(spot.rating.value).toBeLessThanOrEqual(5);
      }
      expect(spot.businessHours).toBeTruthy();
    }
  });

  it('id は重複しない', async () => {
    const spots = await fetchSpots('ja');

    const ids = spots.map((spot) => spot.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('指定した言語の名称を返す', async () => {
    const jaSpots = await fetchSpots('ja');
    const enSpots = await fetchSpots('en');

    expect(jaSpots.find((spot) => spot.id === 'kobe-port-tower')?.name).toBe('神戸ポートタワー');
    expect(enSpots.find((spot) => spot.id === 'kobe-port-tower')?.name).toBe('Kobe Port Tower');
  });
});

describe('fetchSpotById', () => {
  it('指定 ID のスポットを返す', async () => {
    const spot = await fetchSpotById('kobe-port-tower', 'ja');

    expect(spot?.id).toBe('kobe-port-tower');
    expect(spot?.name).toBe('神戸ポートタワー');
    expect(spot?.address).toBeTruthy();
  });

  it('指定した言語の文言を返す', async () => {
    const spot = await fetchSpotById('kobe-port-tower', 'en');

    expect(spot?.name).toBe('Kobe Port Tower');
  });

  it('存在しない ID では null を返す', async () => {
    const spot = await fetchSpotById('does-not-exist', 'ja');

    expect(spot).toBeNull();
  });

  it('一覧の各スポットと詳細取得の内容が一致する', async () => {
    const spots = await fetchSpots('ja');

    for (const listSpot of spots) {
      const detail = await fetchSpotById(listSpot.id, 'ja');
      expect(detail).toEqual(listSpot);
    }
  });

  it('全対応言語で詳細を取得できる', async () => {
    for (const language of SUPPORTED_LANGUAGES) {
      const detail = await fetchSpotById('kobe-port-tower', language);

      expect(detail?.id).toBe('kobe-port-tower');
      expect(detail?.name).toBeTruthy();
      expect(detail?.description).toBeTruthy();
      expect(detail?.address).toBeTruthy();
    }
  });

  it('返却オブジェクトは複製で、変更しても次回取得に影響しない', async () => {
    const first = await fetchSpotById('kobe-port-tower', 'ja');
    if (!first) throw new Error('spot not found');
    first.name = 'mutated';

    const second = await fetchSpotById('kobe-port-tower', 'ja');
    expect(second?.name).toBe('神戸ポートタワー');
  });
});
