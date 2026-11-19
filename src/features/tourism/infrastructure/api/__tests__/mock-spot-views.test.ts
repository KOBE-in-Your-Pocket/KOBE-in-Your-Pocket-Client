import {
  getMockSpotViewCount,
  mockSpotViewRepository,
  resetMockSpotViews,
} from '../mock-spot-views';

const { recordSpotView } = mockSpotViewRepository;

describe('mockSpotViewRepository', () => {
  beforeEach(() => {
    resetMockSpotViews();
  });

  it('最初は 0 回', () => {
    expect(getMockSpotViewCount('kobe-port-tower')).toBe(0);
  });

  it('呼ぶたびに 1 回ずつ増える', async () => {
    await recordSpotView('kobe-port-tower');
    await recordSpotView('kobe-port-tower');

    expect(getMockSpotViewCount('kobe-port-tower')).toBe(2);
  });

  it('スポットごとに別々に数える', async () => {
    await recordSpotView('kobe-port-tower');
    await recordSpotView('kitano-ijinkan');

    expect(getMockSpotViewCount('kobe-port-tower')).toBe(1);
    expect(getMockSpotViewCount('kitano-ijinkan')).toBe(1);
  });

  it('リセットすると 0 回に戻る', async () => {
    await recordSpotView('kobe-port-tower');
    resetMockSpotViews();

    expect(getMockSpotViewCount('kobe-port-tower')).toBe(0);
  });
});
