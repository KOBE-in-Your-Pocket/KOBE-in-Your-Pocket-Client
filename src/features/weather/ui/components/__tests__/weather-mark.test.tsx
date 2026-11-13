import { render, screen } from '@testing-library/react-native';

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

const mockUseWeather = jest.mocked(useWeather);

const OBSERVED_AT = '2026-11-12T05:35:00Z';

function buildWeather(current: number, forecasts: number[] = []): Weather {
  return {
    fetchedAt: OBSERVED_AT,
    observation: { at: OBSERVED_AT, mmPerHour: current },
    forecasts: forecasts.map((mmPerHour, index) => ({
      at: new Date(Date.parse(OBSERVED_AT) + (index + 1) * 10 * 60 * 1000).toISOString(),
      mmPerHour,
    })),
  };
}

function mockWeather(weather: Weather | null | undefined) {
  mockUseWeather.mockReturnValue({ data: weather } as ReturnType<typeof useWeather>);
}

describe('WeatherMark', () => {
  it.each([
    ['noRain', buildWeather(0, [0, 0])],
    ['rainSoon', buildWeather(0, [0, 1])],
    ['lightRain', buildWeather(1)],
    ['rain', buildWeather(5)],
    ['heavyRain', buildWeather(20)],
  ] as const)('%s のアイコンを出し、種類の名前は読み上げにだけ入れる', (kind, weather) => {
    mockWeather(weather);
    render(<WeatherMark />);

    expect(screen.getByTestId(`weather-mark-icon-${kind}`)).toBeTruthy();
    expect(screen.queryByText(`weather.kind.${kind}`)).toBeNull();
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

  it.each([null, undefined])('天気が %s のときは何も出さない', (weather) => {
    mockWeather(weather);
    render(<WeatherMark />);
    expect(screen.queryByTestId('weather-mark')).toBeNull();
  });
});
