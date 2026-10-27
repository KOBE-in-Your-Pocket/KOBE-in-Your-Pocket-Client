import { render, screen } from '@testing-library/react-native';
import { View as MockView } from 'react-native';

import { Map } from '../map';

import type { MapMarker } from '../map.types';
import type { ReactNode } from 'react';

const mockRedraw = jest.fn();

jest.mock('react-native-maps', () => {
  const { forwardRef: fr, useImperativeHandle: uih } = jest.requireActual('react');
  const { View: RNView } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: ({ children }: { children?: ReactNode }) => <RNView>{children}</RNView>,
    Marker: fr(({ children }: { children?: ReactNode }, ref: React.Ref<{ redraw: () => void }>) => {
      uih(ref, () => ({ redraw: mockRedraw }));
      return <RNView>{children}</RNView>;
    }),
    Polyline: () => null,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: () => <MockView testID="evac-icon" />,
}));

const makeShelterMarkers = (count: number): MapMarker[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `shelter-${i}`,
    coordinate: { latitude: 34.69 + i * 0.001, longitude: 135.19 },
    variant: 'evacuation',
  }));

describe('Map の避難所ピン詳細表示（#735 アイコン読込レース対応）', () => {
  beforeEach(() => {
    mockRedraw.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('避難所マーカーが少数でも常にアイコン付きピンにする', () => {
    render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={makeShelterMarkers(2)}
      />,
    );

    expect(screen.getAllByTestId('evac-icon')).toHaveLength(2);
  });

  it('避難所マーカーが多数（50件超）でも全件アイコン付きピンにする（件数による簡易ピン化は廃止）', () => {
    render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={makeShelterMarkers(51)}
      />,
    );

    expect(screen.getAllByTestId('evac-icon')).toHaveLength(51);
  });

  it('現在地が無くてもアイコン付きピンにする（currentLocation に依存しない）', () => {
    render(<Map currentLocation={null} markers={makeShelterMarkers(2)} />);

    expect(screen.getAllByTestId('evac-icon')).toHaveLength(2);
  });

  it('ピン表示直後に redraw() を複数回呼び、アイコンの非同期読込遅延に備える', () => {
    render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={makeShelterMarkers(1)}
      />,
    );

    expect(mockRedraw).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockRedraw).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(mockRedraw).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(700);
    expect(mockRedraw).toHaveBeenCalledTimes(3);
  });

  it('unmount後はタイマーが片付き、redraw() が呼ばれない', () => {
    const { unmount } = render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={makeShelterMarkers(1)}
      />,
    );

    unmount();
    jest.advanceTimersByTime(5000);

    expect(mockRedraw).not.toHaveBeenCalled();
  });
});
