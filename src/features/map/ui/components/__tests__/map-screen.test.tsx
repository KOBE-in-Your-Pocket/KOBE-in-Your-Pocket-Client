import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Text as MockText, View as MockView } from 'react-native';

import { useMapModeStore } from '../../../store/use-map-mode-store';

import { MapScreen } from '../map-screen';

// @/features/evacuation はこのファイルでモック化しているが、useMapModeStore と同様に
// 実物の zustand ストア（同一インスタンス）を取得して直接 setState で操作する。
import { useShelterRadiusStore } from '@/features/evacuation/store/use-shelter-radius-store';
import { useSpotSearchStore } from '@/features/tourism';

import type { ReactNode } from 'react';

// マーカー出し分けの検証用フィクスチャ。
// jest.mock のファクトリから参照するため、out-of-scope 変数制約に合わせて mock プレフィックスを付ける。
const mockSpots = [
  { id: 'spot-1', name: 'スポットA', coordinates: { latitude: 34.7, longitude: 135.2 } },
  { id: 'spot-2', name: 'スポットB', coordinates: { latitude: 34.68, longitude: 135.19 } },
  // 検索キーワード「スポット」に一致しない別名のスポット（#787 の複数ピン検証用）。
  { id: 'spot-3', name: 'テスト地点', coordinates: { latitude: 34.69, longitude: 135.21 } },
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
const mockUseLocalSearchParams = jest.fn();
// useFocusEffect に渡された最新の effect を保持する。実際のフォーカス復帰を再現するため、
// テストから直接呼び出して「他画面から戻ってきた」を模擬する（#740）。
let mockLatestFocusEffect: (() => void) | undefined;

// Map は markers を受け取る共有 UI。ここでは各マーカーの id を testID、variant をテキストとして
// 描画するスタブに差し替え、「どのピンが・どの見た目で」渡されたかを検証できるようにする。
// markerResyncKey もテキストとして出し、再同期（#740）のたびに変わることを検証できるようにする。
type MockMarker = { id: string; variant?: string };

type MockShelter = { id: string; coordinates: { latitude: number; longitude: number } };

jest.mock('@/shared/ui', () => ({
  Map: ({
    markers = [],
    onMarkerPress,
    markerResyncKey = 0,
    mapRemountKey = 0,
    selectedMarkerId,
  }: {
    markers?: MockMarker[];
    onMarkerPress?: (marker: MockMarker) => void;
    markerResyncKey?: number;
    mapRemountKey?: number;
    selectedMarkerId?: string;
  }) => (
    <MockView>
      <MockText testID="marker-resync-key">{markerResyncKey}</MockText>
      <MockText testID="map-remount-key">{mapRemountKey}</MockText>
      <MockText testID="selected-marker-id">{selectedMarkerId ?? ''}</MockText>
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
  // 観光モードでのみ表示されることを検証できるよう、testID 付きスタブに差し替える。
  SpotSearchBar: () => <MockText testID="spot-search-bar">search</MockText>,
  // 0件案内（#788）自体の表示条件は SpotSearchEmptyNotice 自身のテストで検証済みのため、ここでは描画しない。
  SpotSearchEmptyNotice: () => null,
  // キーワード絞り込み本体は use-case 側で検証済みのため、実物をそのまま使う。
  filterSpotsByKeyword:
    jest.requireActual<typeof import('@/features/tourism')>('@/features/tourism')
      .filterSpotsByKeyword,
  // useMapModeStore と同じ方針で、実物の zustand ストアをそのまま使う。
  useSpotSearchStore:
    jest.requireActual<typeof import('@/features/tourism')>('@/features/tourism')
      .useSpotSearchStore,
}));

jest.mock('@/features/evacuation', () => ({
  useEvacuationShelters: () => ({ data: mockShelters }),
  // 距離フィルタ本体は use-case 側で検証。ここでは coords/radiusKm を受け取りつつ返す避難所を差し替えられるようにする。
  filterSheltersWithinRadius: (shelters: MockShelter[], coords: unknown, radiusKm: unknown) =>
    mockFilterShelters(shelters, coords, radiusKm),
  // 実物の zustand ストアをそのまま使う（useMapModeStore と同じ方針）。
  useShelterRadiusStore: jest.requireActual<
    typeof import('@/features/evacuation/store/use-shelter-radius-store')
  >('@/features/evacuation/store/use-shelter-radius-store').useShelterRadiusStore,
  EvacuationShelterCard: ({
    shelter,
    onDetail,
    onClose,
  }: {
    shelter: { id: string };
    onDetail: () => void;
    onClose: () => void;
  }) => (
    <MockView>
      <MockText testID="shelter-card" onPress={onDetail}>
        {shelter.id}
      </MockText>
      <MockText testID="shelter-card-close" onPress={onClose}>
        close
      </MockText>
    </MockView>
  ),
  // 開閉だけ検証できればよいため、visible/onClose を testID 経由で可視化するスタブにする。
  ShelterRadiusModal: ({ visible, onClose }: { visible: boolean; onClose: () => void }) =>
    visible ? (
      <MockText testID="shelter-radius-modal" onPress={onClose}>
        radius-modal
      </MockText>
    ) : null,
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
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  // マウント時に一度だけ実行しつつ、effect 自体は保持する。
  // 再フォーカス（#740）はテストから mockLatestFocusEffect を直接呼んで模擬する。
  useFocusEffect: (effect: () => void) => {
    mockLatestFocusEffect = effect;
    const { useEffect } = jest.requireActual('react');
    useEffect(effect, [effect]);
  },
}));

// MapModeToggle は出し分けの対象外なのでスタブ化する。
jest.mock('../map-mode-toggle', () => ({ MapModeToggle: () => null }));
// ハンバーガーメニューは onPress 配線の検証用に、testID 付きのスタブにする。
jest.mock('../map-settings-button', () => ({
  MapSettingsButton: ({ onPress }: { onPress: () => void }) => (
    <MockText testID="map-settings-button" onPress={onPress}>
      settings
    </MockText>
  ),
}));
// SpotCard は選択状態の可視化に使うため、表示中は spot の id を出すスタブにする。
jest.mock('../spot-card', () => ({
  SpotCard: ({ spot, onClose }: { spot: { id: string }; onClose: () => void }) => (
    <MockView>
      <MockText testID="spot-card">{spot.id}</MockText>
      <MockText testID="spot-card-close" onPress={onClose}>
        close
      </MockText>
    </MockView>
  ),
}));

describe('MapScreen のマーカー出し分け', () => {
  beforeEach(() => {
    // 呼び出し履歴を毎テストで初期化する（toHaveBeenCalledWith が前テストの履歴に
    // マッチして回帰を見逃さないように）。実装は下で再設定する。
    jest.clearAllMocks();
    mockLatestFocusEffect = undefined;
    useMapModeStore.setState({ mapMode: 'tourism' });
    // 既定: 表示半径は 1km（#672 の初期値）。個別テストで上書きする。
    useShelterRadiusStore.setState({ selectedRadiusKm: 1 });
    // 既定: 検索キーワードなし（全件表示）。個別テストで上書きする（#787）。
    useSpotSearchStore.setState({ keyword: '' });
    // 既定: 現在地なし・絞り込みなし（全件返す）。個別テストで上書きする。
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      servicesDisabled: false,
      permissionDenied: false,
    });
    mockFilterShelters.mockImplementation((shelters: MockShelter[]) => shelters);
    mockUseLocalSearchParams.mockReturnValue({});
  });

  it('観光一覧の「経路」から同じスポットへ再遷移すると、閉じた SpotCard が再表示される', () => {
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-1', requestedAt: '1' });
    const { rerender } = render(<MapScreen />);
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-1');
    // 「経路」ボタン経由の選択も、地図への強調表示用 selectedMarkerId に反映される（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('spot-1');

    // ×ボタンでカードを閉じる。同じ遷移のパラメータのままでは再表示されない。
    fireEvent.press(screen.getByTestId('spot-card-close'));
    expect(screen.queryByTestId('spot-card')).toBeNull();
    // カードを閉じると選択も解除され、ピンの強調表示も外れる（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('');
    rerender(<MapScreen />);
    expect(screen.queryByTestId('spot-card')).toBeNull();

    // 地図タブはマウントされたまま、もう一度「経路」を押して同じスポットで遷移してくる。
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-1', requestedAt: '2' });
    rerender(<MapScreen />);
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-1');
  });

  it('避難モードのまま観光スポットへ遷移してきたら、観光モードに切り替えて SpotCard を表示する（#677）', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-1', requestedAt: '1' });

    render(<MapScreen />);

    expect(screen.getByTestId('spot-card').props.children).toBe('spot-1');
    expect(useMapModeStore.getState().mapMode).toBe('tourism');
  });

  it('避難モードのまま観光スポットへ遷移してきてモードが切り替わったとき、mapRemountKey を増やして地図全体を作り直させる（#802）', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-1', requestedAt: '1' });

    render(<MapScreen />);

    expect(screen.getByTestId('map-remount-key').props.children).toBe(1);
    // markerResyncKey（#740 専用）は増やさない。詳細画面から戻る操作以外でカメラ位置が
    // リセットされてしまわないよう、MapView の再生成とは別の state にしているため。
    expect(screen.getByTestId('marker-resync-key').props.children).toBe(0);
    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.queryByTestId('marker-shelter-1')).toBeNull();
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

  it('tourism モードでは検索バーを表示し、evacuation モードでは表示しない（#786）', () => {
    render(<MapScreen />);
    expect(screen.getByTestId('spot-search-bar')).toBeTruthy();

    act(() => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
    });

    expect(screen.queryByTestId('spot-search-bar')).toBeNull();
  });

  it('検索キーワードに一致する観光スポットのピンだけを表示する（#787）', () => {
    render(<MapScreen />);
    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.getByTestId('marker-spot-2')).toBeTruthy();

    act(() => {
      useSpotSearchStore.setState({ keyword: 'スポットA' });
    });

    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.queryByTestId('marker-spot-2')).toBeNull();
  });

  it('キーワードを消すと全件のピンに戻る（#787）', () => {
    useSpotSearchStore.setState({ keyword: 'スポットA' });
    render(<MapScreen />);
    expect(screen.queryByTestId('marker-spot-2')).toBeNull();

    act(() => {
      useSpotSearchStore.setState({ keyword: '' });
    });

    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.getByTestId('marker-spot-2')).toBeTruthy();
  });

  it('選択中のスポットが検索結果から外れたら選択を解除してカードを閉じる（#787）', () => {
    render(<MapScreen />);
    fireEvent.press(screen.getByTestId('marker-spot-2'));
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-2');

    act(() => {
      useSpotSearchStore.setState({ keyword: 'スポットA' });
    });

    expect(screen.queryByTestId('spot-card')).toBeNull();
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('');
  });

  it('地図に検索キーワードが残っていても、一覧の「経路」から遷移したスポットはピン・カードを表示する（#787）', () => {
    useSpotSearchStore.setState({ keyword: 'スポットA' });
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-2', requestedAt: '1' });

    render(<MapScreen />);

    // キーワード「スポットA」には一致しないが、「経路」遷移で指定されたスポットなのでピン・カードとも維持する。
    expect(screen.getByTestId('marker-spot-2')).toBeTruthy();
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-2');

    // ピン留め中のスポット自身を再タップしても解除されない。
    fireEvent.press(screen.getByTestId('marker-spot-2'));
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-2');

    // 別のスポット（通常の検索結果内）をタップすると、ピン留めは引き継がれない。
    fireEvent.press(screen.getByTestId('marker-spot-1'));
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-1');

    act(() => {
      useSpotSearchStore.setState({ keyword: 'スポットB' });
    });

    // ピン留めが外れた spot-1 は検索結果外なので選択解除される。
    expect(screen.queryByTestId('spot-card')).toBeNull();
  });

  it('「経路」遷移で表示を維持したスポットも、遷移後に検索キーワードを変更すると選択解除される（#787）', () => {
    useSpotSearchStore.setState({ keyword: 'スポットA' });
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-2', requestedAt: '1' });

    render(<MapScreen />);
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-2');

    // 遷移時点のキーワード（'スポットA'）に対するピン留めは、ユーザーが新たにキーワードを
    // 変更した時点で解除され、通常の「検索結果から外れたら選択解除」に戻る。
    act(() => {
      useSpotSearchStore.setState({ keyword: 'A' });
    });

    expect(screen.queryByTestId('spot-card')).toBeNull();
    expect(screen.queryByTestId('marker-spot-2')).toBeNull();
  });

  it('ピン留め中のスポットのカードを×で閉じても、検索キーワードに一致する他のスポットのピンは残る（#787）', () => {
    useSpotSearchStore.setState({ keyword: 'スポットA' });
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-2', requestedAt: '1' });

    render(<MapScreen />);
    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.getByTestId('marker-spot-2')).toBeTruthy();
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-2');

    fireEvent.press(screen.getByTestId('spot-card-close'));

    expect(screen.queryByTestId('spot-card')).toBeNull();
    expect(screen.queryByTestId('marker-spot-2')).toBeNull();
    // スポットA は検索キーワードに一致するので、ピン留め解除後も表示され続けるはず。
    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
  });

  it('検索結果に複数ピンがあるとき、検索結果に含まれない別のスポットへ「経路」で遷移しても既存のピンは消えない（#787）', () => {
    // 'スポット' は spot-1・spot-2 に一致するが、spot-3（テスト地点）には一致しない。
    useSpotSearchStore.setState({ keyword: 'スポット' });
    mockUseLocalSearchParams.mockReturnValue({ spotId: 'spot-3', requestedAt: '1' });

    render(<MapScreen />);

    // spot-3 は検索結果に含まれないが、「経路」で指定されたのでピン留めされ追加表示される。
    expect(screen.getByTestId('marker-spot-3')).toBeTruthy();
    expect(screen.getByTestId('spot-card').props.children).toBe('spot-3');
    // 検索結果内の既存のピン（spot-1・spot-2）も消えずに残っているはず。
    expect(screen.getByTestId('marker-spot-1')).toBeTruthy();
    expect(screen.getByTestId('marker-spot-2')).toBeTruthy();
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
    // ピンタップによる選択も selectedMarkerId に反映される（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('spot-1');

    // 避難モードへ切り替えると SpotCard は非表示になる。
    act(() => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
    });
    expect(screen.queryByTestId('spot-card')).toBeNull();
    // モード切替で選択も解除され、強調表示も外れる（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('');

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
    // ピンタップによる選択も selectedMarkerId に反映される（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('shelter-1');
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
    // モード切替で選択も解除され、強調表示も外れる（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('');

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
    // 圏外による自動解除でも強調表示（selectedMarkerId）が外れる（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('');
  });

  it('避難所詳細の住所タップから同じ避難所へ再遷移すると、閉じた EvacuationShelterCard が再表示される（#678）', () => {
    useMapModeStore.setState({ mapMode: 'evacuation' });
    mockUseLocalSearchParams.mockReturnValue({ shelterId: 'shelter-1', requestedAt: '1' });
    const { rerender } = render(<MapScreen />);
    expect(screen.getByTestId('shelter-card').props.children).toBe('shelter-1');
    // 住所タップ経由の選択も、地図への強調表示用 selectedMarkerId に反映される（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('shelter-1');

    // ×ボタンでカードを閉じる。同じ遷移のパラメータのままでは再表示されない。
    fireEvent.press(screen.getByTestId('shelter-card-close'));
    expect(screen.queryByTestId('shelter-card')).toBeNull();
    // カードを閉じると選択も解除され、ピンの強調表示も外れる（#750）。
    expect(screen.getByTestId('selected-marker-id').props.children).toBe('');
    rerender(<MapScreen />);
    expect(screen.queryByTestId('shelter-card')).toBeNull();

    // 地図タブはマウントされたまま、もう一度住所をタップして同じ避難所で遷移してくる。
    mockUseLocalSearchParams.mockReturnValue({ shelterId: 'shelter-1', requestedAt: '2' });
    rerender(<MapScreen />);
    expect(screen.getByTestId('shelter-card').props.children).toBe('shelter-1');
  });

  it('観光モードのまま避難所へ遷移してきたら、避難モードに切り替えて EvacuationShelterCard を表示する（#678）', () => {
    mockUseLocalSearchParams.mockReturnValue({ shelterId: 'shelter-1', requestedAt: '1' });

    render(<MapScreen />);

    expect(screen.getByTestId('shelter-card').props.children).toBe('shelter-1');
    expect(useMapModeStore.getState().mapMode).toBe('evacuation');
  });

  it('1km圏外の避難所でも、住所タップ経由の選択ならピン・カード表示を維持する（#678）', () => {
    // shelter-1 を 1km 圏外（フィルタ対象外）扱いにする。
    mockFilterShelters.mockImplementation((shelters: MockShelter[]) =>
      shelters.filter((shelter) => shelter.id !== 'shelter-1'),
    );
    mockUseLocalSearchParams.mockReturnValue({ shelterId: 'shelter-1', requestedAt: '1' });

    render(<MapScreen />);

    expect(useMapModeStore.getState().mapMode).toBe('evacuation');
    expect(screen.getByTestId('shelter-card').props.children).toBe('shelter-1');
    expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
  });

  it('圏外ピン留め中の避難所自身のマーカーを再タップしても、カード・ピンが消えない（#678）', () => {
    // shelter-1 を 1km 圏外（フィルタ対象外）扱いにする。
    mockFilterShelters.mockImplementation((shelters: MockShelter[]) =>
      shelters.filter((shelter) => shelter.id !== 'shelter-1'),
    );
    mockUseLocalSearchParams.mockReturnValue({ shelterId: 'shelter-1', requestedAt: '1' });

    render(<MapScreen />);
    expect(screen.getByTestId('shelter-card')).toBeTruthy();

    // 圏外ピン（= selectedShelter 自身）を再タップしても選択状態は維持される。
    fireEvent.press(screen.getByTestId('marker-shelter-1'));

    expect(screen.getByTestId('shelter-card').props.children).toBe('shelter-1');
    expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
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
      expect(mockFilterShelters).toHaveBeenCalledWith(mockShelters, null, 1);
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

  describe('避難所の表示半径設定（#672）', () => {
    it('tourism モードではハンバーガーメニューを表示しない', () => {
      render(<MapScreen />);

      expect(screen.queryByTestId('map-settings-button')).toBeNull();
    });

    it('evacuation モードではハンバーガーメニューを表示する', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });

      render(<MapScreen />);

      expect(screen.getByTestId('map-settings-button')).toBeTruthy();
    });

    it('ハンバーガーメニューをタップすると半径設定モーダルが開き、閉じると閉じる', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });

      render(<MapScreen />);
      expect(screen.queryByTestId('shelter-radius-modal')).toBeNull();

      fireEvent.press(screen.getByTestId('map-settings-button'));
      expect(screen.getByTestId('shelter-radius-modal')).toBeTruthy();

      fireEvent.press(screen.getByTestId('shelter-radius-modal'));
      expect(screen.queryByTestId('shelter-radius-modal')).toBeNull();
    });

    it('モーダルを開いたまま観光モードへ切り替わると、半径設定モーダルも閉じる', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });

      render(<MapScreen />);
      fireEvent.press(screen.getByTestId('map-settings-button'));
      expect(screen.getByTestId('shelter-radius-modal')).toBeTruthy();

      // spotId 付きの遷移で観光モードへ強制的に切り替わるケース（#677 と同じ経路）。
      act(() => {
        useMapModeStore.setState({ mapMode: 'tourism' });
      });

      expect(screen.queryByTestId('shelter-radius-modal')).toBeNull();
    });

    it('選択中の半径（km）をフィルタに渡す（#676）', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
      useShelterRadiusStore.setState({ selectedRadiusKm: 3 });
      mockUseCurrentLocation.mockReturnValue({
        coords: { latitude: 34.69, longitude: 135.19 },
        servicesDisabled: false,
        permissionDenied: false,
      });

      render(<MapScreen />);

      expect(mockFilterShelters).toHaveBeenCalledWith(
        mockShelters,
        { latitude: 34.69, longitude: 135.19 },
        3,
      );
    });

    it('「無制限」（null）を選ぶと絞り込まず全件表示する（#676）', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });
      useShelterRadiusStore.setState({ selectedRadiusKm: null });
      mockUseCurrentLocation.mockReturnValue({
        coords: { latitude: 34.69, longitude: 135.19 },
        servicesDisabled: false,
        permissionDenied: false,
      });
      // 「無制限」のときはフィルタ自体を呼ばない実装のため、呼ばれたら誤って絞り込んでいる。
      mockFilterShelters.mockImplementation((shelters: MockShelter[]) =>
        shelters.filter((shelter) => shelter.id === 'shelter-1'),
      );

      render(<MapScreen />);

      expect(mockFilterShelters).not.toHaveBeenCalled();
      expect(screen.getByTestId('marker-shelter-1')).toBeTruthy();
      expect(screen.getByTestId('marker-shelter-2')).toBeTruthy();
    });
  });

  describe('画面遷移から戻ったときのマーカー再同期（#740）', () => {
    it('避難所詳細を開いて戻ってきたときだけ markerResyncKey が増える', () => {
      useMapModeStore.setState({ mapMode: 'evacuation' });

      render(<MapScreen />);
      expect(screen.getByTestId('marker-resync-key').props.children).toBe(0);

      // タブ切替などの無関係な再フォーカスでは増えない。
      act(() => mockLatestFocusEffect?.());
      expect(screen.getByTestId('marker-resync-key').props.children).toBe(0);

      // 避難所カードの詳細ボタンで避難所詳細画面へ遷移する。
      fireEvent.press(screen.getByTestId('marker-shelter-1'));
      fireEvent.press(screen.getByTestId('shelter-card'));
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/evacuation/[id]',
        params: { id: 'shelter-1' },
      });

      // 詳細画面から戻って再フォーカスされると、マーカーの再同期キーが変わる。
      act(() => mockLatestFocusEffect?.());
      expect(screen.getByTestId('marker-resync-key').props.children).toBe(1);
      // MapView 自体は作り直さない（カメラ位置を保持するため #802 用の key とは別にしている）。
      expect(screen.getByTestId('map-remount-key').props.children).toBe(0);

      // フラグは一度使うと消費されるので、続けて再フォーカスしても増えない。
      act(() => mockLatestFocusEffect?.());
      expect(screen.getByTestId('marker-resync-key').props.children).toBe(1);
    });
  });
});
