import type { Weather } from '../../domain/weather';

import { MOCK_WEATHER_PATTERN, createMockWeather } from './mock-weather';

// 実 API への切り替えは #781
export const fetchWeather = async (): Promise<Weather> => createMockWeather(MOCK_WEATHER_PATTERN);
