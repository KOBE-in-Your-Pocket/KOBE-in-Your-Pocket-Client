import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  Alert,
  Linking,
  Platform,
  Text as MockText,
  View as MockView,
  type AlertButton,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { EvacuationShelterDetailScreen } from '../evacuation-shelter-detail-screen';

import type { EvacuationShelter } from '../../../domain/evacuation-shelter';
import type { ReactNode } from 'react';

const shelter: EvacuationShelter = {
  id: 'shelter-1',
  name: '避難所A',
  address: '住所A',
  coordinates: { latitude: 34.6826, longitude: 135.1863 },
  type: 'designated',
  facilityCategory: 'school',
  media: { imageUrl: '' },
  accessible: true,
};

const ORIGIN = { latitude: 34.694722, longitude: 135.195833 };

// buildDirectionsUrl のプラットフォーム分岐と一致する期待 URL（出発地あり）。
const IOS_URL_WITH_ORIGIN =
  'http://maps.apple.com/?saddr=34.694722,135.195833&daddr=34.6826,135.1863&dirflg=w';
const GOOGLE_URL_WITH_ORIGIN =
  'https://www.google.com/maps/dir/?api=1&destination=34.6826,135.1863&travelmode=walking&origin=34.694722,135.195833';
// 現在地を取得できないときのフォールバック（出発地は外部マップ側に任せる）。
const IOS_URL_NO_ORIGIN = 'http://maps.apple.com/?daddr=34.6826,135.1863&dirflg=w';
const GOOGLE_URL_NO_ORIGIN =
  'https://www.google.com/maps/dir/?api=1&destination=34.6826,135.1863&travelmode=walking';

// jest.mock ファクトリから参照するため mock プレフィックスを付ける（out-of-scope 変数制約）。
const mockUseCurrentLocation = jest.fn();
const mockUseEvacuationShelterDetail = jest.fn();

// application 層は隔離し、UI から open-directions を呼ぶ経路の検証に集中する。
jest.mock('../../../application/hooks/use-evacuation-shelter-detail', () => ({
  useEvacuationShelterDetail: () => mockUseEvacuationShelterDetail(),
}));

// 出典・免責は shelter-dataset-notice のテストで検証する。
// ここでは QueryClient を要求しないよう隔離するだけ。
jest.mock('../../../application/hooks/use-shelter-dataset-metadata', () => ({
  useShelterDatasetMetadata: () => ({ data: null }),
}));

jest.mock('@/shared/lib/geo', () => ({
  useCurrentLocation: () => mockUseCurrentLocation(),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ text: '#000000', textSecondary: '#60646C', background: '#FFFFFF' }),
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
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(() => true), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// @/shared/lib/directions はあえてモックしない。
// UI ボタン → confirmOpenDirections → openDirections → Linking.openURL の実経路を通す。

const DIRECTIONS_LABEL = 'evacuation.shelterDetail.openDirectionsButton';

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const openURLSpy = jest.spyOn(Linking, 'openURL');
const originalOS = Platform.OS;

/** 経路案内ボタンを押し、確認ダイアログの「開く」を承認したときの副作用を再現する。 */
async function pressDirectionsAndConfirm() {
  fireEvent.press(screen.getByLabelText(DIRECTIONS_LABEL));

  const buttons = (alertSpy.mock.calls[0]?.[2] ?? []) as AlertButton[];
  const confirm = buttons.find((button) => button.text === 'map.openDirections.confirm');

  await act(async () => {
    await confirm?.onPress?.();
  });
}

describe('避難所詳細からの外部マップ起動フォールバック分岐', () => {
  beforeEach(() => {
    alertSpy.mockClear();
    openURLSpy.mockReset().mockResolvedValue(true);
    mockUseEvacuationShelterDetail.mockReturnValue({
      data: shelter,
      isPending: false,
      isError: false,
    });
    mockUseCurrentLocation.mockReturnValue({
      coords: ORIGIN,
      permissionDenied: false,
      servicesDisabled: false,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  afterAll(() => {
    alertSpy.mockRestore();
    openURLSpy.mockRestore();
  });

  describe('現在地あり: プラットフォーム別の URL で開く', () => {
    it.each([
      ['ios', IOS_URL_WITH_ORIGIN],
      ['android', GOOGLE_URL_WITH_ORIGIN],
      ['web', GOOGLE_URL_WITH_ORIGIN],
    ] as const)('%s では出発地入りの外部マップ URL を開く', async (platformOs, expectedUrl) => {
      Platform.OS = platformOs;
      render(<EvacuationShelterDetailScreen shelterId="shelter-1" />);

      await pressDirectionsAndConfirm();

      expect(openURLSpy).toHaveBeenCalledTimes(1);
      expect(openURLSpy).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('現在地なし（フォールバック）: 出発地を外部マップに委ねる', () => {
    it.each([
      ['ios', IOS_URL_NO_ORIGIN],
      ['android', GOOGLE_URL_NO_ORIGIN],
      ['web', GOOGLE_URL_NO_ORIGIN],
    ] as const)('%s では出発地を含めない URL を開く', async (platformOs, expectedUrl) => {
      mockUseCurrentLocation.mockReturnValue({
        coords: null,
        permissionDenied: true,
        servicesDisabled: false,
        loading: false,
        error: null,
      });
      Platform.OS = platformOs;
      render(<EvacuationShelterDetailScreen shelterId="shelter-1" />);

      await pressDirectionsAndConfirm();

      expect(openURLSpy).toHaveBeenCalledWith(expectedUrl);
    });
  });

  it('ボタン押下では確認ダイアログを出すだけで、承認するまで外部マップは開かない', () => {
    Platform.OS = 'ios';
    render(<EvacuationShelterDetailScreen shelterId="shelter-1" />);

    fireEvent.press(screen.getByLabelText(DIRECTIONS_LABEL));

    expect(alertSpy).toHaveBeenCalledWith(
      'map.openDirections.confirmTitle',
      'map.openDirections.confirmMessage',
      expect.any(Array),
    );
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('確認ダイアログをキャンセルすると外部マップは開かない', () => {
    Platform.OS = 'ios';
    render(<EvacuationShelterDetailScreen shelterId="shelter-1" />);

    fireEvent.press(screen.getByLabelText(DIRECTIONS_LABEL));

    const buttons = (alertSpy.mock.calls[0]?.[2] ?? []) as AlertButton[];
    const cancel = buttons.find((button) => button.style === 'cancel');
    cancel?.onPress?.();

    expect(cancel).toBeDefined();
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('外部マップ起動に失敗したらエラーダイアログを表示する', async () => {
    openURLSpy.mockRejectedValueOnce(new Error('Cannot open URL'));
    Platform.OS = 'android';
    render(<EvacuationShelterDetailScreen shelterId="shelter-1" />);

    await pressDirectionsAndConfirm();

    expect(openURLSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenLastCalledWith(
      'map.openDirections.errorTitle',
      'map.openDirections.errorMessage',
    );
  });
});

describe('避難所詳細の値の無い項目の表示分岐', () => {
  beforeEach(() => {
    mockUseCurrentLocation.mockReturnValue({
      coords: null,
      permissionDenied: false,
      servicesDisabled: false,
      loading: false,
      error: null,
    });
  });

  it('capacity・externalUrl が無い避難所ではその項目を表示しない', () => {
    mockUseEvacuationShelterDetail.mockReturnValue({
      data: shelter,
      isPending: false,
      isError: false,
    });

    render(<EvacuationShelterDetailScreen shelterId="shelter-1" />);

    expect(screen.queryByText('evacuation.list.capacity')).toBeNull();
    expect(screen.queryByLabelText('evacuation.shelterDetail.externalLink')).toBeNull();
  });

  it('capacity・externalUrl がある避難所ではその項目を表示する', () => {
    mockUseEvacuationShelterDetail.mockReturnValue({
      data: { ...shelter, capacity: 300, externalUrl: 'https://example.com/shelter-1' },
      isPending: false,
      isError: false,
    });

    render(<EvacuationShelterDetailScreen shelterId="shelter-1" />);

    expect(screen.getByText('evacuation.list.capacity')).toBeTruthy();
    expect(screen.getByLabelText('evacuation.shelterDetail.externalLink')).toBeTruthy();
  });
});
