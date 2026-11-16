import { act, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text as MockText, type StyleProp, type TextStyle } from 'react-native';

import { useWeather } from '../../../application/use-weather';
import type { Weather } from '../../../domain/weather';
import { WeatherMark } from '../weather-mark';

jest.mock('../../../application/use-weather', () => ({
  useWeather: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// 文言はキーで出し、どの種類の文言を引いたかを検証できるようにする。
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

// @/shared/ui をそのまま読むと地図のネイティブモジュールまで読み込まれるため、ThemedText だけ差し替える。
jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
    <MockText style={style}>{children}</MockText>
  ),
}));

const mockUseWeather = jest.mocked(useWeather);

const OBSERVED_AT = '2026-11-12T05:35:00Z';

// fetchedAt の 30 分以内を「今」にして、古いデータとみなされないようにする
const NOW_MS = Date.parse(OBSERVED_AT) + 5 * 60 * 1000;

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW_MS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function buildWeather(current: number, forecasts: number[] = [], fetchedAt = OBSERVED_AT): Weather {
  return {
    fetchedAt,
    observation: { at: OBSERVED_AT, mmPerHour: current },
    forecasts: forecasts.map((mmPerHour, index) => ({
      at: new Date(Date.parse(OBSERVED_AT) + (index + 1) * 10 * 60 * 1000).toISOString(),
      mmPerHour,
    })),
  };
}

function mockWeather(weather: Weather | null) {
  mockUseWeather.mockReturnValue({
    data: weather,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useWeather>);
}

function mockPending() {
  mockUseWeather.mockReturnValue({
    data: undefined,
    isPending: true,
    isError: false,
  } as unknown as ReturnType<typeof useWeather>);
}

function mockError(weather?: Weather) {
  mockUseWeather.mockReturnValue({
    data: weather,
    isPending: false,
    isError: true,
  } as unknown as ReturnType<typeof useWeather>);
}

function expectUnavailable() {
  expect(screen.getByText('weather.unavailable')).toBeTruthy();
  expect(screen.getByTestId('weather-mark-unavailable').props.accessibilityLabel).toBe(
    'weather.unavailable',
  );
  expect(screen.queryByTestId('weather-mark')).toBeNull();
}

describe('WeatherMark', () => {
  it.each([
    ['noRain', buildWeather(0, [0, 0])],
    ['rainSoon', buildWeather(0, [0, 1])],
    ['lightRain', buildWeather(1)],
    ['rain', buildWeather(5)],
    ['heavyRain', buildWeather(20)],
  ] as const)('%s のマークと文言を出す', (kind, weather) => {
    mockWeather(weather);
    render(<WeatherMark />);

    expect(screen.getByTestId(`weather-mark-icon-${kind}`)).toBeTruthy();
    expect(screen.getByText(`weather.kind.${kind}`)).toBeTruthy();
    expect(screen.getByTestId('weather-mark').props.accessibilityLabel).toBe(
      `weather.accessibilityLabel:${JSON.stringify({ kind: `weather.kind.${kind}` })}`,
    );
  });

  it('強い雨のときだけ注意の色の枠を付ける', () => {
    mockWeather(buildWeather(20));
    const { rerender } = render(<WeatherMark />);
    expect(screen.getByTestId('weather-mark')).toHaveStyle({ borderColor: '#D32F2F' });

    mockWeather(buildWeather(5));
    rerender(<WeatherMark />);
    expect(screen.getByTestId('weather-mark')).not.toHaveStyle({ borderColor: '#D32F2F' });
  });

  it('topOffset の分だけ下げて置く', () => {
    mockWeather(buildWeather(0));
    render(<WeatherMark topOffset={60} />);
    // insets.top（0）+ Spacing.three（16）+ 60
    expect(screen.getByTestId('weather-mark')).toHaveStyle({ top: 76 });
  });

  it('取得中は何も出さない', () => {
    mockPending();
    render(<WeatherMark />);
    expect(screen.queryByTestId('weather-mark')).toBeNull();
    expect(screen.queryByTestId('weather-mark-unavailable')).toBeNull();
  });

  it('取得に失敗したときは「天気を取得できませんでした」を出す', () => {
    mockError();
    render(<WeatherMark />);
    expectUnavailable();
  });

  it('fetchedAt が 30 分より古いときは「天気を取得できませんでした」を出す', () => {
    const fetchedAt = new Date(NOW_MS - 30 * 60 * 1000 - 1).toISOString();
    mockWeather(buildWeather(5, [], fetchedAt));
    render(<WeatherMark />);
    expectUnavailable();
  });

  it('天気が null（まだデータが無い）のときは「天気を取得できませんでした」を出す', () => {
    mockWeather(null);
    render(<WeatherMark />);
    expectUnavailable();
  });

  it('再取得に失敗しても、前回のデータが新しければ天気マークを出す', () => {
    mockError(buildWeather(5));
    render(<WeatherMark />);
    expect(screen.getByTestId('weather-mark-icon-rain')).toBeTruthy();
    expect(screen.queryByTestId('weather-mark-unavailable')).toBeNull();
  });

  it('地図を開いたまま 30 分を過ぎたら「天気を取得できませんでした」に切り替える', () => {
    jest.useFakeTimers({ now: NOW_MS });
    try {
      mockWeather(buildWeather(5));
      render(<WeatherMark />);
      expect(screen.getByTestId('weather-mark-icon-rain')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(30 * 60 * 1000);
      });
      expectUnavailable();
    } finally {
      jest.useRealTimers();
    }
  });

  it('失敗した表示も topOffset の分だけ下げて置く', () => {
    mockError();
    render(<WeatherMark topOffset={60} />);
    expect(screen.getByTestId('weather-mark-unavailable')).toHaveStyle({ top: 76 });
  });
});
