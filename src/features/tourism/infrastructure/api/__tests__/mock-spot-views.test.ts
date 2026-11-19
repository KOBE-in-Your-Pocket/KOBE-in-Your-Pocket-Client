import { createMockSpotViewRepository } from '../mock-spot-views';

describe('createMockSpotViewRepository', () => {
  it('最初は 0 回', () => {
    const repository = createMockSpotViewRepository();

    expect(repository.getViewCount('kobe-port-tower')).toBe(0);
  });

  it('呼ぶたびに 1 回ずつ増える', async () => {
    const repository = createMockSpotViewRepository();

    await repository.recordSpotView('kobe-port-tower');
    await repository.recordSpotView('kobe-port-tower');

    expect(repository.getViewCount('kobe-port-tower')).toBe(2);
  });

  it('スポットごとに別々に数える', async () => {
    const repository = createMockSpotViewRepository();

    await repository.recordSpotView('kobe-port-tower');
    await repository.recordSpotView('kitano-ijinkan');

    expect(repository.getViewCount('kobe-port-tower')).toBe(1);
    expect(repository.getViewCount('kitano-ijinkan')).toBe(1);
  });

  it('作るたびに別々の記録を持つ', async () => {
    const first = createMockSpotViewRepository();
    const second = createMockSpotViewRepository();

    await first.recordSpotView('kobe-port-tower');

    expect(second.getViewCount('kobe-port-tower')).toBe(0);
  });
});
