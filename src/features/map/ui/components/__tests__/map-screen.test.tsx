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

// jest.mock ファクトリから差し替えるため、mock プレフィックス付きで宣言する。
const mockUseCurrentLocation = jest.fn();
const mockFilterShelters = jest.fn();

// Map は markers を受け取る共有 UI。ここでは各マーカーの id を testID、variant をテキストとして
// 描画するスタブに差し替え、「どのピンが・どの見た目で」渡されたかを検証できるようにする。
type MockMarker = { id: string; variant?: string };

type MockShelter = { id: string; coordinates: { latitude: number; longitude: number } };

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
  // 距離フィルタ本体は use-case 側で検証。ここでは coords を受け取りつつ返す避難所を差し替えられるようにする。
  filterSheltersWithinRadius: (shelters: MockShelter[], coords: unknown) =>
    mockFilterShelters(shelters, coords),
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
  useCurrentLocation: () => mockUseCurrentLocation(),
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
    // 呼び出し履歴を毎テストで初期化する（toHaveBeenCalledWith が前テストの履歴に
    // マッチして回帰を見逃さないように）。実装は下で再設定する。
    jest.clearAllMocks();
    useMapModeStore.setState({ mapMode: 'tourism' });
    // 既定: 現在地なし・絞り込みなし（全件返す）。個別テストで上書きする。
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      servicesDisabled: false,
      permissionDenied: false,
    });
    mockFilterShelters.mockImplementation((shelters: MockShelter[]) => shelters);
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

  it('選択中の避難所が 1km 圏外（フィルタ対象外）になったら選択を解除する（#594）', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });
    mockUseCurrentLocation.mockReturnValue({
      coords: { latitude: 34.69, longitude: 135.19 },
      servicesDisabled: false,
      permissionDenied: false,
    });

    const { rerender } = render(<MapScreen />);
    fireEvent.press(screen.getByTestId('marker-shelter-1'));
    expect(screen.getByTestId('shelter-card').props.children).toBe('shelter-1');

    // 現在地が更新され、shelter-1 がフィルタ結果（1km 圏内）から外れる。
    mockFilterShelters.mockImplementation((shelters: MockShelter[]) =>
      shelters.filter((shelter) => shelter.id !== 'shelter-1'),
    );
    mockUseCurrentLocation.mockReturnValue({
      coords: { latitude: 35.0, longitude: 135.6 },
      servicesDisabled: false,
      permissionDenied: false,
    });
    rerender(<MapScreen />);

    // ピンが消え、カード（と経路の起点）も残らない。
    expect(screen.queryByTestId('marker-shelter-1')).toBeNull();
    expect(screen.queryByTestId('shelter-card')).toBeNull();
  });

  describe('現在地未取得時のフォールバック（#604）', () => {
    it('現在地が取得できないときは全件（フィルタ結果）をピン表示し、coords=null で絞り込む', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
      // 既定（beforeEach）で現在地なし・全件返し。

      render(<MapScreen />);

      // 全避難所のピンが出る（半径で絞らない）。
      expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
      expect(screen.getByTestId('marker-shelter-2')).toBeTruthy();
      // 画面は現在地（null）をフィルタに渡している。
      expect(mockFilterShelters).toHaveBeenCalledWith(mockShelters, null);
    });

    it('現在地取得後は半径内の絞り込み結果へ切り替わる', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });

      // 最初は現在地なし＝全件。
      const { rerender } = render(<MapScreen />);
      expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
      expect(screen.getByTestId('marker-shelter-2')).toBeTruthy();

      // 現在地が取得でき、半径内が shelter-1 だけになる。
      mockUseCurrentLocation.mockReturnValue({
        coords: { latitude: 34.69, longitude: 135.19 },
        servicesDisabled: false,
        permissionDenied: false,
      });
      mockFilterShelters.mockImplementation((shelters: MockShelter[]) =>
        shelters.filter((shelter) => shelter.id === 'shelter-1'),
      );
      rerender(<MapScreen />);

      expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
      expect(screen.queryByTestId('marker-shelter-2')).toBeNull();
    });
  });
});
