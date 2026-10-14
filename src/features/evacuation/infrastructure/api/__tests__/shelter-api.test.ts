import { ApiError } from '@/shared/lib/api';

import type { EvacuationShelter } from '../../../domain/evacuation-shelter';
import { fetchEvacuationShelterDataset } from '../shelter-api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const shelterFixture: EvacuationShelter = {
  id: 'shelter-1',
  name: '避難所A',
  address: '住所A',
  coordinates: { latitude: 34.69, longitude: 135.19 },
  type: 'designated',
  facilityCategory: 'school',
  media: { imageUrl: 'https://images.kobe-pocket.example.com/shelters/shelter-1/main.jpg' },
  accessible: false,
};

const metaFixture = {
  source: '神戸市オープンデータ',
  asOf: '2025-04-02',
  updatedAt: '2025-04-02T00:00:00Z',
};

describe('fetchEvacuationShelterDataset', () => {
  const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://10.0.2.2:9090';
  });

  afterAll(() => {
    if (originalBaseUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalBaseUrl;
    }
  });

  it('GET /api/v1/evacuation/shelters を lang クエリ付きで呼ぶ', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { data: [shelterFixture], meta: metaFixture }));

    await fetchEvacuationShelterDataset('ja');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://10.0.2.2:9090/api/v1/evacuation/shelters?lang=ja',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('{ data, meta } 封筒を shelters と metadata に分けて返す', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, { data: [shelterFixture], meta: metaFixture }));

    await expect(fetchEvacuationShelterDataset('ja')).resolves.toEqual({
      shelters: [shelterFixture],
      metadata: metaFixture,
    });
  });

  it('meta が出典・基準日を満たさないときは metadata を null にする（一覧は返す）', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(200, { data: [shelterFixture], meta: { updatedAt: '2025-04-02T00:00:00Z' } }),
    );

    await expect(fetchEvacuationShelterDataset('ja')).resolves.toEqual({
      shelters: [shelterFixture],
      metadata: null,
    });
  });

  it('レスポンスの電話番号をドメインに取り込む', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        data: [{ ...shelterFixture, phoneNumber: '078-411-0556' }],
        meta: metaFixture,
      }),
    );

    const { shelters } = await fetchEvacuationShelterDataset('ja');

    expect(shelters).toEqual([{ ...shelterFixture, phoneNumber: '078-411-0556' }]);
  });

  it.each([
    ['フィールド欠落', {}],
    ['null', { phoneNumber: null }],
    ['空文字', { phoneNumber: '' }],
    ['空白のみ', { phoneNumber: '   ' }],
  ])('電話番号が未登録（%s）のときは phoneNumber を持たない', async (_label, phoneField) => {
    mockFetch.mockResolvedValue(
      jsonResponse(200, { data: [{ ...shelterFixture, ...phoneField }], meta: metaFixture }),
    );

    const { shelters } = await fetchEvacuationShelterDataset('ja');

    expect(shelters).toEqual([shelterFixture]);
    expect(shelters[0]).not.toHaveProperty('phoneNumber');
  });

  describe('suitability（災害種別ごとの適否）', () => {
    const suitability = {
      landslide: 'suitable',
      flood: 'conditional',
      tsunami: 'unsuitable',
      'large-fire': 'not-applicable',
    };

    async function fetchSheltersWith(shelterFields: Record<string, unknown>) {
      mockFetch.mockResolvedValue(
        jsonResponse(200, { data: [{ ...shelterFixture, ...shelterFields }], meta: metaFixture }),
      );

      return (await fetchEvacuationShelterDataset('ja')).shelters;
    }

    it('レスポンスの災害種別ごとの適否をドメインに取り込む', async () => {
      await expect(fetchSheltersWith({ suitability })).resolves.toEqual([
        { ...shelterFixture, suitability },
      ]);
    });

    it.each([
      ['フィールド欠落', {}],
      ['null', { suitability: null }],
      ['空オブジェクト', { suitability: {} }],
      ['オブジェクト以外', { suitability: 'suitable' }],
    ])('情報が無い（%s）ときは suitability を持たない', async (_label, shelterFields) => {
      const shelters = await fetchSheltersWith(shelterFields);

      expect(shelters).toEqual([shelterFixture]);
      expect(shelters[0]).not.toHaveProperty('suitability');
    });

    it('未知の災害種別・未知の適否は無視し、既知のものだけ取り込む', async () => {
      const shelters = await fetchSheltersWith({
        suitability: {
          flood: 'suitable',
          tsunami: 'unknown-value',
          'storm-surge': 'suitable',
        },
      });

      expect(shelters[0].suitability).toEqual({ flood: 'suitable' });
    });
  });

  it('非 2xx レスポンスは ApiError として伝播する', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(500, { status: 500, error: 'INTERNAL', message: '内部エラー' }),
    );

    await expect(fetchEvacuationShelterDataset('ja')).rejects.toBeInstanceOf(ApiError);
  });
});
