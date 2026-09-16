import { apiFetch } from '@/shared/lib/api';

import { fetchMannerById, fetchManners } from '../manner-api';

jest.mock('@/shared/lib/api', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = jest.mocked(apiFetch);

/** backend `MannerItemResponse` の 1 件（imageKey は含まれない）。 */
function response(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'nankinmachi-street-food',
    title: '食べ歩きは指定の場所で',
    description: '南京町では歩きながらの飲食を控える。',
    icon: 'food',
    kind: 'manner',
    scope: 'local',
    relatedSpotIds: ['nankinmachi'],
    ...overrides,
  };
}

describe('fetchManners', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('lang クエリ付きで一覧エンドポイントを呼ぶ', async () => {
    mockApiFetch.mockResolvedValue([]);

    await fetchManners('ja');

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/manner/items', { query: { lang: 'ja' } });
  });

  it('backend が返さない imageKey は icon と同じキーで補う', async () => {
    mockApiFetch.mockResolvedValue([response()]);

    const [manner] = await fetchManners('ja');

    expect(manner.icon).toBe('food');
    expect(manner.imageKey).toBe('food');
  });

  it('id / title / description / relatedSpotIds をそのまま引き継ぐ', async () => {
    mockApiFetch.mockResolvedValue([response()]);

    const [manner] = await fetchManners('ja');

    expect(manner).toMatchObject({
      id: 'nankinmachi-street-food',
      title: '食べ歩きは指定の場所で',
      description: '南京町では歩きながらの飲食を控える。',
      relatedSpotIds: ['nankinmachi'],
    });
  });

  it.each([
    ['manner', 'manner'],
    ['rule', 'rule'],
  ])('kind %s をそのまま解決する', async (wire, expected) => {
    mockApiFetch.mockResolvedValue([response({ kind: wire })]);

    const [manner] = await fetchManners('ja');

    expect(manner.kind).toBe(expected);
  });

  it.each([
    ['local', 'local'],
    ['japan', 'japan'],
  ])('scope %s をそのまま解決する', async (wire, expected) => {
    mockApiFetch.mockResolvedValue([response({ scope: wire })]);

    const [manner] = await fetchManners('ja');

    expect(manner.scope).toBe(expected);
  });

  it('想定外の kind / scope はフィルタが壊れないよう既定値へ寄せる', async () => {
    mockApiFetch.mockResolvedValue([response({ kind: 'unknown', scope: 'unknown' })]);

    const [manner] = await fetchManners('ja');

    expect(manner.kind).toBe('manner');
    expect(manner.scope).toBe('local');
  });
});

describe('fetchMannerById', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('一覧から該当 ID の項目を返す', async () => {
    mockApiFetch.mockResolvedValue([response(), response({ id: 'no-littering', icon: 'trash' })]);

    const manner = await fetchMannerById('no-littering', 'ja');

    expect(manner?.id).toBe('no-littering');
    expect(manner?.imageKey).toBe('trash');
  });

  it('該当が無ければ null を返す', async () => {
    mockApiFetch.mockResolvedValue([response()]);

    await expect(fetchMannerById('unknown-id', 'ja')).resolves.toBeNull();
  });

  it('取得は一覧エンドポイントに lang クエリ付きで行う', async () => {
    mockApiFetch.mockResolvedValue([]);

    await fetchMannerById('no-littering', 'en');

    expect(mockApiFetch).toHaveBeenCalledWith('/api/v1/manner/items', { query: { lang: 'en' } });
  });
});
