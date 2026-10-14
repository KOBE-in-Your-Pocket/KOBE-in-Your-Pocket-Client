import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  Text as MockText,
  View as MockView,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useDisasterFilterStore } from '../../../store/use-disaster-filter-store';

import { EvacuationList } from '../evacuation-list';

import type { EvacuationShelter } from '../../../domain/evacuation-shelter';
import type { ReactNode } from 'react';

const DEFAULT_SHELTER: EvacuationShelter = {
  id: 'shelter-1',
  name: '避難所A',
  address: '住所A',
  coordinates: { latitude: 34.69, longitude: 135.19 },
  type: 'designated',
  facilityCategory: 'school',
  media: { imageUrl: '' },
  accessible: true,
};

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockUseEvacuationShelters = jest.fn();
const mockUseCurrentLocation = jest.fn();

jest.mock('../../../application/hooks/use-evacuation-shelters', () => ({
  useEvacuationShelters: () => mockUseEvacuationShelters(),
}));

// フッターの出典・免責は shelter-dataset-notice のテストで検証する。
// ここでは QueryClient を要求しないよう隔離するだけ。
jest.mock('../../../application/hooks/use-shelter-dataset-metadata', () => ({
  useShelterDatasetMetadata: () => ({ data: null }),
}));

jest.mock('@/shared/lib/geo', () => ({
  useCurrentLocation: () => mockUseCurrentLocation(),
  getDistanceKm: () => 1,
  formatDistanceKm: (km: number) => `${km} km`,
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({
    text: '#000000',
    textSecondary: '#60646C',
    background: '#FFFFFF',
  }),
}));

jest.mock('@/shared/config', () => ({
  Spacing: { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 },
}));

jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
    <MockText style={style}>{children}</MockText>
  ),
  ThemedView: ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
    <MockView style={style}>{children}</MockView>
  ),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  useDisasterFilterStore.setState({ selectedDisasters: [] });
  mockUseEvacuationShelters.mockReturnValue({
    data: [DEFAULT_SHELTER],
    isPending: false,
    isError: false,
  });
});

describe('EvacuationList の位置情報フォールバック表示', () => {
  beforeEach(() => {
    mockUseCurrentLocation.mockReturnValue({
      coords: { latitude: 34.694722, longitude: 135.195833 },
      permissionDenied: false,
      servicesDisabled: false,
    });
  });

  it('位置情報が取得できている場合、バナーを表示しない', () => {
    render(<EvacuationList />);

    expect(screen.queryByText('location.permissionDeniedNotice')).toBeNull();
    expect(screen.queryByText('evacuation.list.locationServicesDisabled')).toBeNull();
  });

  it('permissionDenied のとき、権限拒否バナーを表示する', () => {
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      permissionDenied: true,
      servicesDisabled: false,
    });

    render(<EvacuationList />);

    expect(screen.getByText('location.permissionDeniedNotice')).toBeTruthy();
  });

  it('servicesDisabled のとき、サービスオフバナーを表示する', () => {
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      permissionDenied: false,
      servicesDisabled: true,
    });

    render(<EvacuationList />);

    expect(screen.getByText('evacuation.list.locationServicesDisabled')).toBeTruthy();
  });

  it('permissionDenied でも一覧自体は表示され続ける', () => {
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      permissionDenied: true,
      servicesDisabled: false,
    });

    render(<EvacuationList />);

    expect(screen.getByText('避難所A')).toBeTruthy();
  });

  it('showHeader=false でも位置情報バナーは表示される', () => {
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      permissionDenied: true,
      servicesDisabled: false,
    });

    render(<EvacuationList showHeader={false} />);

    expect(screen.getByText('location.permissionDeniedNotice')).toBeTruthy();
    expect(screen.queryByText('evacuation.list.title')).toBeNull();
  });

  it('showHeader=false かつ位置情報も正常な場合、ヘッダー要素は何も表示しない', () => {
    render(<EvacuationList showHeader={false} />);

    expect(screen.queryByText('evacuation.list.title')).toBeNull();
    expect(screen.queryByText('location.permissionDeniedNotice')).toBeNull();
    expect(screen.getByText('避難所A')).toBeTruthy();
  });
});

describe('EvacuationList の収容人数表示', () => {
  beforeEach(() => {
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      permissionDenied: false,
      servicesDisabled: false,
    });
  });

  it.each([true, false])('バリアフリー情報（accessible: %s）を表示しない', (accessible) => {
    mockUseEvacuationShelters.mockReturnValue({
      data: [{ ...DEFAULT_SHELTER, accessible }],
      isPending: false,
      isError: false,
    });

    render(<EvacuationList />);

    expect(screen.queryByText(/evacuation\.list\.accessible/)).toBeNull();
  });

  it('電話番号がある避難所は電話番号を表示する', () => {
    mockUseEvacuationShelters.mockReturnValue({
      data: [{ ...DEFAULT_SHELTER, phoneNumber: '078-411-0556' }],
      isPending: false,
      isError: false,
    });

    render(<EvacuationList />);

    expect(screen.getByText('evacuation.shelterCard.phoneLabel: 078-411-0556')).toBeTruthy();
  });

  it('電話番号が未登録の避難所は電話番号の行を表示しない', () => {
    render(<EvacuationList />);

    expect(screen.queryByText(/evacuation\.shelterCard\.phoneLabel/)).toBeNull();
  });

  it('capacity が無い避難所は収容人数の行を表示しない', () => {
    render(<EvacuationList />);

    expect(screen.queryByText('evacuation.list.capacity')).toBeNull();
  });

  it('capacity がある避難所は収容人数を表示する', () => {
    mockUseEvacuationShelters.mockReturnValue({
      data: [{ ...DEFAULT_SHELTER, capacity: 120 }],
      isPending: false,
      isError: false,
    });

    render(<EvacuationList />);

    expect(screen.getByText('evacuation.list.capacity')).toBeTruthy();
  });
});

describe('EvacuationList の災害種別タグによる絞り込み', () => {
  const FLOOD_SHELTER: EvacuationShelter = {
    ...DEFAULT_SHELTER,
    id: 'flood',
    name: '洪水で使える避難所',
    suitability: {
      landslide: 'unsuitable',
      flood: 'suitable',
      tsunami: 'unsuitable',
      'large-fire': 'not-applicable',
    },
  };
  const TSUNAMI_SHELTER: EvacuationShelter = {
    ...DEFAULT_SHELTER,
    id: 'tsunami',
    name: '津波で使える避難所',
    suitability: {
      landslide: 'unsuitable',
      flood: 'unsuitable',
      tsunami: 'suitable',
      'large-fire': 'not-applicable',
    },
  };
  const FLOOD_CONDITIONAL_SHELTER: EvacuationShelter = {
    ...DEFAULT_SHELTER,
    id: 'flood-conditional',
    name: '洪水は条件付きの避難所',
    suitability: {
      landslide: 'unsuitable',
      flood: 'conditional',
      tsunami: 'unsuitable',
      'large-fire': 'not-applicable',
    },
  };

  beforeEach(() => {
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      permissionDenied: false,
      servicesDisabled: false,
    });
    mockUseEvacuationShelters.mockReturnValue({
      data: [FLOOD_CONDITIONAL_SHELTER, FLOOD_SHELTER, TSUNAMI_SHELTER],
      isPending: false,
      isError: false,
    });
  });

  it.each(['landslide', 'flood', 'tsunami', 'large-fire'])('%s のタグを表示する', (disaster) => {
    render(<EvacuationList />);

    expect(screen.getByText(`evacuation.disasterFilter.${disaster}`)).toBeTruthy();
  });

  it('showHeader=false でもタグを表示する', () => {
    render(<EvacuationList showHeader={false} />);

    expect(screen.getByText('evacuation.disasterFilter.flood')).toBeTruthy();
  });

  it('タグを選んでいなければ全件を表示する', () => {
    render(<EvacuationList />);

    expect(screen.getByText('洪水で使える避難所')).toBeTruthy();
    expect(screen.getByText('津波で使える避難所')).toBeTruthy();
    expect(screen.getByText('洪水は条件付きの避難所')).toBeTruthy();
  });

  it('タグを 1 つ選ぶと、その災害が suitable の避難所だけを表示する', () => {
    render(<EvacuationList />);

    fireEvent.press(screen.getByText('evacuation.disasterFilter.flood'));

    expect(screen.getByText('洪水で使える避難所')).toBeTruthy();
    expect(screen.queryByText('津波で使える避難所')).toBeNull();
    expect(screen.queryByText('洪水は条件付きの避難所')).toBeNull();
  });

  it('タグを複数選ぶと、いずれかの災害で suitable の避難所を表示する', () => {
    render(<EvacuationList />);

    fireEvent.press(screen.getByText('evacuation.disasterFilter.flood'));
    fireEvent.press(screen.getByText('evacuation.disasterFilter.tsunami'));

    expect(screen.getByText('洪水で使える避難所')).toBeTruthy();
    expect(screen.getByText('津波で使える避難所')).toBeTruthy();
    expect(screen.queryByText('洪水は条件付きの避難所')).toBeNull();
  });

  it('選択中のタグをもう一度押すと選択が外れ、全件表示に戻る', () => {
    render(<EvacuationList />);

    fireEvent.press(screen.getByText('evacuation.disasterFilter.flood'));
    fireEvent.press(screen.getByText('evacuation.disasterFilter.flood'));

    expect(screen.getByText('津波で使える避難所')).toBeTruthy();
    expect(screen.getByText('洪水は条件付きの避難所')).toBeTruthy();
  });

  it('該当 0 件のときは専用の文言を表示し、タグは残す', () => {
    render(<EvacuationList />);

    fireEvent.press(screen.getByText('evacuation.disasterFilter.large-fire'));

    expect(screen.getByText('evacuation.list.filterEmpty')).toBeTruthy();
    expect(screen.queryByText('evacuation.list.empty')).toBeNull();
    expect(screen.getByText('evacuation.disasterFilter.large-fire')).toBeTruthy();
  });

  it('絞り込み後の先頭の避難所に「最寄り」バッジが付く', () => {
    mockUseCurrentLocation.mockReturnValue({
      coords: { latitude: 34.694722, longitude: 135.195833 },
      permissionDenied: false,
      servicesDisabled: false,
    });
    render(<EvacuationList />);

    fireEvent.press(screen.getByText('evacuation.disasterFilter.tsunami'));

    expect(screen.getByText('津波で使える避難所')).toBeTruthy();
    expect(screen.queryByText('洪水は条件付きの避難所')).toBeNull();
    expect(screen.getAllByText('evacuation.list.nearest')).toHaveLength(1);
  });
});
