import { Linking } from 'react-native';

import { buildDirectionsUrl, openDirections, type DirectionsCoordinate } from '../open-directions';

const destination: DirectionsCoordinate = { latitude: 34.6826, longitude: 135.1863 };
const origin: DirectionsCoordinate = { latitude: 34.694722, longitude: 135.195833 };

const GOOGLE_WALKING_NO_ORIGIN =
  'https://www.google.com/maps/dir/?api=1&destination=34.6826,135.1863&travelmode=walking';
const GOOGLE_WALKING_WITH_ORIGIN =
  'https://www.google.com/maps/dir/?api=1&destination=34.6826,135.1863&travelmode=walking&origin=34.694722,135.195833';

describe('buildDirectionsUrl', () => {
  describe('iOS（Apple マップ）', () => {
    it('出発地ありで saddr / daddr / 徒歩(dirflg=w) を含む', () => {
      const url = buildDirectionsUrl(destination, { origin, mode: 'walking', platformOs: 'ios' });

      expect(url).toBe(
        'http://maps.apple.com/?saddr=34.694722,135.195833&daddr=34.6826,135.1863&dirflg=w',
      );
    });

    it('出発地なしなら saddr を含めず現在地に任せる', () => {
      const url = buildDirectionsUrl(destination, { platformOs: 'ios' });

      expect(url).toBe('http://maps.apple.com/?daddr=34.6826,135.1863&dirflg=w');
    });

    it('移動手段に応じて dirflg が変わる', () => {
      expect(buildDirectionsUrl(destination, { mode: 'driving', platformOs: 'ios' })).toContain(
        'dirflg=d',
      );
      expect(buildDirectionsUrl(destination, { mode: 'transit', platformOs: 'ios' })).toContain(
        'dirflg=r',
      );
    });
  });

  describe('Android / Web（Google マップ）', () => {
    it.each(['android', 'web'] as const)(
      '%s: 出発地ありで origin / destination / travelmode を含む',
      (platformOs) => {
        const url = buildDirectionsUrl(destination, {
          origin,
          mode: 'walking',
          platformOs,
        });

        expect(url).toBe(GOOGLE_WALKING_WITH_ORIGIN);
      },
    );

    it.each(['android', 'web'] as const)('%s: 出発地なしなら origin を含めない', (platformOs) => {
      const url = buildDirectionsUrl(destination, { platformOs });

      expect(url).toBe(GOOGLE_WALKING_NO_ORIGIN);
    });

    it.each(['android', 'web'] as const)(
      '%s: 移動手段に応じて travelmode が変わる',
      (platformOs) => {
        expect(buildDirectionsUrl(destination, { mode: 'driving', platformOs })).toContain(
          'travelmode=driving',
        );
        expect(buildDirectionsUrl(destination, { mode: 'transit', platformOs })).toContain(
          'travelmode=transit',
        );
      },
    );
  });

  describe('プラットフォーム別フォールバック', () => {
    it.each([
      ['ios', /^http:\/\/maps\.apple\.com\//],
      ['android', /^https:\/\/www\.google\.com\/maps\/dir\//],
      ['web', /^https:\/\/www\.google\.com\/maps\/dir\//],
    ] as const)('platformOs=%s は期待する外部マップ URL スキームを返す', (platformOs, pattern) => {
      expect(buildDirectionsUrl(destination, { platformOs })).toMatch(pattern);
    });

    it.each([
      ['ios', 'maps.apple.com'],
      ['android', 'google.com/maps'],
      ['web', 'google.com/maps'],
    ] as const)(
      'platformOs=%s は他プラットフォーム用 URL を含まない',
      (platformOs, expectedHost) => {
        const url = buildDirectionsUrl(destination, { platformOs });

        expect(url).toContain(expectedHost);
        if (platformOs === 'ios') {
          expect(url).not.toContain('google.com');
        } else {
          expect(url).not.toContain('maps.apple.com');
        }
      },
    );
  });

  it('origin が null の場合は出発地を含めない', () => {
    expect(buildDirectionsUrl(destination, { origin: null, platformOs: 'ios' })).not.toContain(
      'saddr=',
    );
    expect(buildDirectionsUrl(destination, { origin: null, platformOs: 'android' })).not.toContain(
      'origin=',
    );
    expect(buildDirectionsUrl(destination, { origin: null, platformOs: 'web' })).not.toContain(
      'origin=',
    );
  });

  it('mode 未指定なら徒歩がデフォルト', () => {
    expect(buildDirectionsUrl(destination, { platformOs: 'ios' })).toContain('dirflg=w');
    expect(buildDirectionsUrl(destination, { platformOs: 'android' })).toContain(
      'travelmode=walking',
    );
    expect(buildDirectionsUrl(destination, { platformOs: 'web' })).toContain('travelmode=walking');
  });
});

describe('openDirections', () => {
  const openURLMock = jest.spyOn(Linking, 'openURL');

  beforeEach(() => {
    openURLMock.mockClear();
    openURLMock.mockResolvedValue(true);
  });

  afterAll(() => {
    openURLMock.mockRestore();
  });

  it.each([
    ['ios', 'http://maps.apple.com/?daddr=34.6826,135.1863&dirflg=w'],
    ['android', GOOGLE_WALKING_NO_ORIGIN],
    ['web', GOOGLE_WALKING_NO_ORIGIN],
  ] as const)(
    'platformOs=%s なら buildDirectionsUrl と同じ URL で Linking.openURL する',
    async (platformOs, expectedUrl) => {
      await openDirections(destination, { platformOs });

      expect(openURLMock).toHaveBeenCalledTimes(1);
      expect(openURLMock).toHaveBeenCalledWith(expectedUrl);
    },
  );

  it('Linking.openURL の拒否は呼び出し元へ伝播する', async () => {
    const error = new Error('Cannot open URL');
    openURLMock.mockRejectedValueOnce(error);

    await expect(openDirections(destination, { platformOs: 'web' })).rejects.toThrow(error);
  });
});
