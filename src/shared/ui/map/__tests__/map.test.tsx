import { render, screen } from '@testing-library/react-native';
import { View as MockView } from 'react-native';

import { Map } from '../map';

import type { MapMarker } from '../map.types';
import type { ReactNode } from 'react';

jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
  Marker: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
  Polyline: () => null,
  PROVIDER_GOOGLE: 'google',
}));

jest.mock('expo-symbols', () => ({
  SymbolView: () => <MockView testID="evac-icon" />,
}));

const makeShelterMarkers = (count: number): MapMarker[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `shelter-${i}`,
    coordinate: { latitude: 34.69 + i * 0.001, longitude: 135.19 },
    variant: 'evacuation',
  }));

describe('Map の避難所ピン詳細表示切り替え（#676 レビュー対応）', () => {
  it('現在地があっても、避難所マーカーが閾値以下なら詳細ピン（アイコン付き）にする', () => {
    render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={makeShelterMarkers(2)}
      />,
    );

    expect(screen.getAllByTestId('evac-icon')).toHaveLength(2);
  });

  it('避難所マーカーがちょうど閾値（50件）なら詳細ピンにする（境界値は閾値側を含む）', () => {
    render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={makeShelterMarkers(50)}
      />,
    );

    expect(screen.getAllByTestId('evac-icon')).toHaveLength(50);
  });

  it('現在地があっても、避難所マーカーが閾値を超えたら簡易ピン（アイコン無し）にする（無制限半径 × GPS ON の退行防止）', () => {
    render(
      <Map
        currentLocation={{ latitude: 34.69, longitude: 135.19 }}
        markers={makeShelterMarkers(51)}
      />,
    );

    expect(screen.queryAllByTestId('evac-icon')).toHaveLength(0);
  });

  it('現在地が無くても、避難所マーカーが閾値以下なら詳細ピンにする（件数ベースなので currentLocation に依存しない）', () => {
    render(<Map currentLocation={null} markers={makeShelterMarkers(2)} />);

    expect(screen.getAllByTestId('evac-icon')).toHaveLength(2);
  });
});
