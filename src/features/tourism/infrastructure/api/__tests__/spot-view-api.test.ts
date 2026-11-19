import { getMockSpotViewCount, resetMockSpotViews } from '../mock-spot-views';
import { recordSpotView } from '../spot-view-api';

describe('recordSpotView', () => {
  beforeEach(() => {
    resetMockSpotViews();
  });

  it('backend の API ができるまではモックで閲覧を数える', async () => {
    await expect(recordSpotView('kobe-port-tower')).resolves.toBeUndefined();

    expect(getMockSpotViewCount('kobe-port-tower')).toBe(1);
  });
});
