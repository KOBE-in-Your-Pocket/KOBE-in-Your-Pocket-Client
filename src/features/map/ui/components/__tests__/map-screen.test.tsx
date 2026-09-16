import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text as MockText, View as MockView } from 'react-native';

import { useMapModeStore } from '../../../store/use-map-mode-store';

import { MapScreen } from '../map-screen';

import type { ReactNode } from 'react';

// マーカー出し分けの検証用フィクスチャ。
// jest.mock のファクトリから参照するため、out-of-scope 変数制約に合わせて mock プレフィックスを付ける。
const mockSpots = [
  { id: 'spot-1', name: 'スポットA', coordinates: { latitude: 34.7, longitude: 135.2 } },
  { id: 'spot-2', name: 'スポットB', coordinates: { latitude: 34.68, longitude: 135.19 } },
];
const mockShelters = [
  {
    id: 'shelter-1',
    name: '避難所A',
    address: '住所A',
    type: 'emergency',
    coordinates: { latitude: 34.69, longitude: 135.19 },
  },
  {
    id: 'shelter-2',
    name: '避難所B',
    address: '住所B',
    type: 'designated',
    capacity: 1000,
    coordinates: { latitude: 34.67, longitude: 135.16 },
  },
];

// Map は markers を受け取る共有 UI。ここでは各マーカーの id を testID、variant をテキストとして
// 描画するスタブに差し替え、「どのピンが・どの見た目で」渡されたかを検証できるようにする。
type MockMarker = { id: string; variant?: string };

jest.mock('@/shared/ui', () => ({
  Map: ({
    markers = [],
    onMarkerPress,
  }: {
    markers?: MockMarker[];
    onMarkerPress?: (marker: MockMarker) => void;
  }) => (
    <MockView>
      {markers.map((marker) => (
        <MockText
          key={marker.id}
          testID={`marker-${marker.id}`}
          onPress={() => onMarkerPress?.(marker)}
        >
          {marker.variant ?? 'tourism'}
        </MockText>
      ))}
    </MockView>
  ),
  LocationServicesModal: () => null,
  ThemedView: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('@/features/tourism', () => ({
  useSpots: () => ({ data: mockSpots }),
}));

jest.mock('@/features/evacuation', () => ({
  useEvacuationShelters: () => ({ data: mockShelters }),
  EvacuationShelterCard: ({
    shelter,
    onDetail,
  }: {
    shelter: { id: string };
    onDetail: () => void;
  }) => (
    <MockText testID="shelter-card" onPress={onDetail}>
      {shelter.id}
    </MockText>
  ),
}));

jest.mock('@/shared/lib/geo', () => ({
  useCurrentLocation: () => ({ coords: null, servicesDisabled: false, permissionDenied: false }),
  getDistanceKm: () => 0,
}));

jest.mock('@/shared/lib/directions', () => ({
  confirmOpenDirections: jest.fn(),
}));

jest.mock('../../../application/use-route', () => ({
  useRoute: () => ({ data: undefined }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

// MapModeToggle は出し分けの対象外なのでスタブ化する。
jest.mock('../map-mode-toggle', () => ({ MapModeToggle: () => null }));
// SpotCard は選択状態の可視化に使うため、表示中は spot の id を出すスタブにする。
jest.mock('../spot-card', () => ({
  SpotCard: ({ spot }: { spot: { id: string } }) => (
    <MockText testID="spot-card">{spot.id}</MockText>
  ),
}));

describe('MapScreen のマーカー出し分け', () => {
  beforeEach(() => {
    useMapModeStore.setState({ mapMode: 'tourism' });
  });

  it('tourism モードでは観光スポットのピンを表示する', () => {
    render(<MapScreen />);

    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.getByTestId('marker-spot-2')).toBeTruthy();
    // 避難所ピンは表示しない
    expect(screen.queryByTestId('marker-shelter-1')).toBeNull();
    // 見た目は標準ピン（tourism）
    expect(screen.getByTestId('marker-spot-1').props.children).toBe('tourism');
  });

  it('evacuation モードでは避難所のピンを variant=evacuation で表示する', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });

    render(<MapScreen />);

    expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
    expect(screen.getByTestId('marker-shelter-2')).toBeTruthy();
    // 観光スポットピンは表示しない
    expect(screen.queryByTestId('marker-spot-1')).toBeNull();
    // 見た目は避難所ピン（evacuation）
    expect(screen.getByTestId('marker-shelter-1').props.children).toBe('evacuation');
  });

  it('モード切替でピンが即座に切り替わる（再マウント不要）', () => {
    render(<MapScreen />);
    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.queryByTestId('marker-shelter-1')).toBeNull();

    // 同一インスタンスのままストアの mapMode を切り替える。
    act(() => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
    });

    expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
    expect(screen.queryByTestId('marker-spot-1')).toBeNull();

    // 観光へ戻すと即座に観光ピンへ戻る。
    act(() => {
      useMapModeStore.setState({ mapMode: 'tourism' });
    });

    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.queryByTestId('marker-shelter-1')).toBeNull();
  });

  it('避難モードへ切替→観光へ戻しても、選択していた SpotCard は再表示されない', () => {
    render(<MapScreen />);

    // 観光モードでスポットを選択すると SpotCard が表示される。
    fireEvent.press(screen.getByTestId('marker-spot-1'));
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-1');

    // 避難モードへ切り替えると SpotCard は非表示になる。
    act(() => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
    });
    expect(screen.queryByTestId('spot-card')).toBeNull();

    // 観光モードへ戻しても、ユーザーが再選択していない SpotCard は表示されない（selectedSpot がリセット済み）。
    act(() => {
      useMapModeStore.setState({ mapMode: 'tourism' });
    });
    expect(screen.queryByTestId('spot-card')).toBeNull();
  });

  it('避難モードで避難所ピンをタップすると EvacuationShelterCard が表示される', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });

    render(<MapScreen />);
    expect(screen.queryByTestId('shelter-card')).toBeNull();

    fireEvent.press(screen.getByTestId('marker-shelter-1'));

    expect(screen.getByTestId('shelter-card').props.children).toBe('shelter-1');
  });

  it('避難所カードの詳細ボタンで避難所詳細画面へ遷移する', () => {
    (router.push as jest.Mock).mockClear();
    useMapModeStore.setState({ mapMode: 'evacuation' });

    render(<MapScreen />);
    fireEvent.press(screen.getByTestId('marker-shelter-1'));

    // カード（スタブ）の onDetail を発火させる。
    fireEvent.press(screen.getByTestId('shelter-card'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/evacuation/[id]',
      params: { id: 'shelter-1' },
    });
  });

  it('避難所選択中に観光モードへ切り替えるとカードがリセットされる', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });

    render(<MapScreen />);
    fireEvent.press(screen.getByTestId('marker-shelter-1'));
    expect(screen.getByTestId('shelter-card')).toBeTruthy();

    act(() => {
      useMapModeStore.setState({ mapMode: 'tourism' });
    });
    expect(screen.queryByTestId('shelter-card')).toBeNull();

    // 避難モードへ戻しても、ユーザーが再選択していないカードは表示されない（selectedShelter がリセット済み）。
    act(() => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
    });
    expect(screen.queryByTestId('shelter-card')).toBeNull();
  });
});
