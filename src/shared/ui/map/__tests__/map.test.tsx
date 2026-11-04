import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, View as MockView } from 'react-native';

import { Map } from '../map';
import { TOURISM_PIN_HEAD_SIZE } from '../styles/map.styles';

import type { MapMarker } from '../map.types';
import type { ReactNode } from 'react';
import type { ReactTestInstance } from 'react-test-renderer';

const mockRedraw = jest.fn();

jest.mock('react-native-maps', () => {
  const { forwardRef: fr, useImperativeHandle: uih } = jest.requireActual('react');
  const { View: RNView } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: ({ children }: { children?: ReactNode }) => <RNView>{children}</RNView>,
    Marker: fr(
      (
        {
          children,
          onPress,
          zIndex,
        }: { children?: ReactNode; onPress?: () => void; zIndex?: number },
        ref: React.Ref<{ redraw: () => void }>,
      ) => {
        uih(ref, () => ({ redraw: mockRedraw }));
        return (
          <RNView onPress={onPress} zIndex={zIndex}>
            {children}
          </RNView>
        );
      },
    ),
    Polyline: () => null,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: () => <MockView testID="evac-icon" />,
}));

/** `instance` から `zIndex` prop を持つ最も近い祖先（モック Marker の描画先）を探す。 */
const findMarkerZIndex = (instance: ReactTestInstance): number | undefined => {
  let node: ReactTestInstance | null = instance;
  while (node) {
    if (node.props.zIndex !== undefined) return node.props.zIndex as number;
    node = node.parent;
  }
  return undefined;
};

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

describe('Map の観光ピン（#748 カスタムピン化）', () => {
  beforeEach(() => {
    mockRedraw.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('OS 標準ピンではなくカスタムの観光ピンで表示する', () => {
    render(
      <Map
        currentLocation={null}
        markers={[{ id: 'spot-1', coordinate: { latitude: 34.69, longitude: 135.19 } }]}
      />,
    );

    expect(screen.getByTestId('tourism-pin')).toBeTruthy();
  });

  it('ピンをタップすると onMarkerPress が呼ばれる', () => {
    const marker: MapMarker = { id: 'spot-1', coordinate: { latitude: 34.69, longitude: 135.19 } };
    const onMarkerPress = jest.fn();
    render(<Map currentLocation={null} markers={[marker]} onMarkerPress={onMarkerPress} />);

    fireEvent.press(screen.getByTestId('tourism-pin').parent as ReactTestInstance);

    expect(onMarkerPress).toHaveBeenCalledWith(marker);
  });

  it('ピン表示直後に redraw() を複数回呼び、レイアウト確定前のスナップショット固定に備える', () => {
    render(
      <Map
        currentLocation={null}
        markers={[{ id: 'spot-1', coordinate: { latitude: 34.69, longitude: 135.19 } }]}
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
});

describe('Map の選択中ピン拡大・手前表示（#749）', () => {
  beforeEach(() => {
    mockRedraw.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('selectedMarkerId に一致する観光ピンだけ拡大し、zIndex が手前になる', () => {
    const markerA: MapMarker = { id: 'spot-a', coordinate: { latitude: 34.69, longitude: 135.19 } };
    const markerB: MapMarker = { id: 'spot-b', coordinate: { latitude: 34.7, longitude: 135.2 } };

    render(<Map currentLocation={null} markers={[markerA, markerB]} selectedMarkerId="spot-a" />);

    const [pinA, pinB] = screen.getAllByTestId('tourism-pin');
    const headA = StyleSheet.flatten((pinA.children[0] as ReactTestInstance).props.style);
    const headB = StyleSheet.flatten((pinB.children[0] as ReactTestInstance).props.style);

    expect(headA.width).toBeGreaterThan(TOURISM_PIN_HEAD_SIZE);
    expect(headB.width).toBe(TOURISM_PIN_HEAD_SIZE);
    expect(findMarkerZIndex(pinA)).toBe(1);
    expect(findMarkerZIndex(pinB)).toBe(0);
  });

  it('現在地ピンは選択中のピンより常に手前（zIndex 最大）になる', () => {
    const marker: MapMarker = { id: 'spot-a', coordinate: { latitude: 34.69, longitude: 135.19 } };

    render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={[marker]}
        selectedMarkerId="spot-a"
      />,
    );

    const currentLocationPin = screen.getByTestId('current-location-pin');
    const tourismPin = screen.getByTestId('tourism-pin');

    expect(findMarkerZIndex(currentLocationPin)).toBeGreaterThan(
      findMarkerZIndex(tourismPin) as number,
    );
  });

  it('selectedMarkerId に一致する避難所ピンだけ拡大する', () => {
    const markers = makeShelterMarkers(2);

    render(<Map currentLocation={null} markers={markers} selectedMarkerId={markers[0].id} />);

    const [pinA, pinB] = screen.getAllByTestId('evacuation-pin');
    const headA = StyleSheet.flatten((pinA.children[0] as ReactTestInstance).props.style);
    const headB = StyleSheet.flatten((pinB.children[0] as ReactTestInstance).props.style);

    expect(headA.width).toBeGreaterThan(headB.width as number);
  });

  it('selectedMarkerId が別のピンに変わると、拡大表示も切り替わる', () => {
    const markerA: MapMarker = { id: 'spot-a', coordinate: { latitude: 34.69, longitude: 135.19 } };
    const markerB: MapMarker = { id: 'spot-b', coordinate: { latitude: 34.7, longitude: 135.2 } };

    const { rerender } = render(
      <Map currentLocation={null} markers={[markerA, markerB]} selectedMarkerId="spot-a" />,
    );

    rerender(<Map currentLocation={null} markers={[markerA, markerB]} selectedMarkerId="spot-b" />);

    const [pinA, pinB] = screen.getAllByTestId('tourism-pin');
    const headA = StyleSheet.flatten((pinA.children[0] as ReactTestInstance).props.style);
    const headB = StyleSheet.flatten((pinB.children[0] as ReactTestInstance).props.style);

    expect(headA.width).toBe(TOURISM_PIN_HEAD_SIZE);
    expect(headB.width).toBeGreaterThan(TOURISM_PIN_HEAD_SIZE);
  });

  it('selectedMarkerId が未指定に戻ると、元の大きさに戻る', () => {
    const marker: MapMarker = { id: 'spot-a', coordinate: { latitude: 34.69, longitude: 135.19 } };

    const { rerender } = render(
      <Map currentLocation={null} markers={[marker]} selectedMarkerId="spot-a" />,
    );

    rerender(<Map currentLocation={null} markers={[marker]} />);

    const pin = screen.getByTestId('tourism-pin');
    const head = StyleSheet.flatten((pin.children[0] as ReactTestInstance).props.style);

    expect(head.width).toBe(TOURISM_PIN_HEAD_SIZE);
  });

  it('選択状態が切り替わるたびに redraw() を複数回呼び、サイズ変更直後のスナップショット固定に備える', () => {
    const marker: MapMarker = { id: 'spot-a', coordinate: { latitude: 34.69, longitude: 135.19 } };

    const { rerender } = render(<Map currentLocation={null} markers={[marker]} />);
    jest.advanceTimersByTime(1500);
    mockRedraw.mockClear();

    rerender(<Map currentLocation={null} markers={[marker]} selectedMarkerId="spot-a" />);

    expect(mockRedraw).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockRedraw).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(500);
    expect(mockRedraw).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(700);
    expect(mockRedraw).toHaveBeenCalledTimes(3);
  });
});
