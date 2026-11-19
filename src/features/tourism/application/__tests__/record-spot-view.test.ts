import { recordSpotView } from '../record-spot-view';

describe('recordSpotView', () => {
  it('渡した repository でスポットの閲覧を数える', async () => {
    const repository = { recordSpotView: jest.fn(async () => undefined) };

    await expect(recordSpotView('kobe-port-tower', repository)).resolves.toBeUndefined();
    expect(repository.recordSpotView).toHaveBeenCalledWith('kobe-port-tower');
  });

  it('repository の失敗をそのまま返す', async () => {
    const error = new Error('network error');
    const repository = { recordSpotView: jest.fn(async () => Promise.reject(error)) };

    await expect(recordSpotView('kobe-port-tower', repository)).rejects.toBe(error);
  });
});
