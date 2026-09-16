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

  it('非 2xx レスポンスは ApiError として伝播する', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(500, { status: 500, error: 'INTERNAL', message: '内部エラー' }),
    );

    await expect(fetchEvacuationShelterDataset('ja')).rejects.toBeInstanceOf(ApiError);
  });
});
