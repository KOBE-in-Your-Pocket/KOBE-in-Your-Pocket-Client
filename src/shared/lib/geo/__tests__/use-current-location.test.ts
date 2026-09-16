/// <reference types="jest" />
import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';

import {
  createDevDefaultCoords,
  SANNOMIYA_STATION_COORDS,
  shouldUseDevDefaultLocation,
} from '../dev-default-coordinates';
import { useCurrentLocation } from '../hooks/use-current-location';

import { useAgeRestrictionStore } from '@/shared/store';

jest.mock('expo-location');
jest.mock('../dev-default-coordinates', () => ({
  ...jest.requireActual('../dev-default-coordinates'),
  shouldUseDevDefaultLocation: jest.fn(() => false),
}));

const mockedShouldUseDevDefaultLocation = shouldUseDevDefaultLocation as jest.MockedFunction<
  typeof shouldUseDevDefaultLocation
>;

const mockedRequestPermissions = Location.requestForegroundPermissionsAsync as jest.MockedFunction<
  typeof Location.requestForegroundPermissionsAsync
>;
const mockedGetCurrentPosition = Location.getCurrentPositionAsync as jest.MockedFunction<
  typeof Location.getCurrentPositionAsync
>;
const mockedHasServicesEnabled = Location.hasServicesEnabledAsync as jest.MockedFunction<
  typeof Location.hasServicesEnabledAsync
>;

const sampleCoords: Location.LocationObjectCoords = {
  latitude: 34.69,
  longitude: 135.195,
  altitude: null,
  accuracy: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

describe('useCurrentLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedShouldUseDevDefaultLocation.mockReturnValue(false);
    mockedHasServicesEnabled.mockResolvedValue(true);
    // 年齢制限は既定で「制限あり」のため、位置情報そのものの検証では成人として扱う。
    // 制限が掛かっている場合の挙動は「年齢による制限」ブロックで検証する。
    useAgeRestrictionStore.setState({ isAdult: true });
  });

  it('returns coords when permission is granted', async () => {
    mockedRequestPermissions.mockResolvedValue({
      status: 'granted',
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);
    mockedGetCurrentPosition.mockResolvedValue({
      coords: sampleCoords,
      timestamp: 0,
    });

    const { result } = renderHook(() => useCurrentLocation());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.coords).toEqual(sampleCoords);
    expect(result.current.error).toBeNull();
    expect(result.current.permissionDenied).toBe(false);
    expect(result.current.servicesDisabled).toBe(false);
    expect(result.current.restrictedByAge).toBe(false);
    expect(mockedGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('flags servicesDisabled before requesting permission when services are off', async () => {
    // iOS ではサービスのグローバルオフが権限拒否として返ることがあるため、
    // 権限より先にサービス状態を確認し、権限要求には進まないことを検証する。
    mockedHasServicesEnabled.mockResolvedValue(false);
    mockedRequestPermissions.mockResolvedValue({
      status: 'denied',
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);

    const { result } = renderHook(() => useCurrentLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.coords).toBeNull();
    expect(result.current.servicesDisabled).toBe(true);
    expect(result.current.permissionDenied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(mockedRequestPermissions).not.toHaveBeenCalled();
    expect(mockedGetCurrentPosition).not.toHaveBeenCalled();
  });

  it('flags permissionDenied and sets an error when permission is denied', async () => {
    mockedRequestPermissions.mockResolvedValue({
      status: 'denied',
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);

    const { result } = renderHook(() => useCurrentLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.coords).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.permissionDenied).toBe(true);
    expect(mockedGetCurrentPosition).not.toHaveBeenCalled();
  });

  it('sets an error when getCurrentPositionAsync throws', async () => {
    mockedRequestPermissions.mockResolvedValue({
      status: 'granted',
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);
    mockedGetCurrentPosition.mockRejectedValue(new Error('location unavailable'));

    const { result } = renderHook(() => useCurrentLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.coords).toBeNull();
    expect(result.current.error).toEqual(new Error('location unavailable'));
    expect(result.current.permissionDenied).toBe(false);
  });

  it('uses Sannomiya Station as default in dev environments', async () => {
    mockedShouldUseDevDefaultLocation.mockReturnValue(true);

    const { result } = renderHook(() => useCurrentLocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.coords).toEqual(createDevDefaultCoords());
    expect(result.current.coords).toEqual(SANNOMIYA_STATION_COORDS);
    expect(result.current.error).toBeNull();
    expect(result.current.permissionDenied).toBe(false);
    expect(mockedRequestPermissions).not.toHaveBeenCalled();
    expect(mockedGetCurrentPosition).not.toHaveBeenCalled();
  });

  describe('年齢による制限', () => {
    beforeEach(() => {
      useAgeRestrictionStore.setState({ isAdult: false });
    });

    it('18歳未満には権限ダイアログを出さず、現在地も取得しない', async () => {
      // 「尋ねたうえで使わない」のでは子供の位置情報に触れる余地が残るため、
      // 権限要求そのものに到達しないことを検証する。
      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.coords).toBeNull();
      expect(result.current.restrictedByAge).toBe(true);
      expect(mockedHasServicesEnabled).not.toHaveBeenCalled();
      expect(mockedRequestPermissions).not.toHaveBeenCalled();
      expect(mockedGetCurrentPosition).not.toHaveBeenCalled();
    });

    it('権限拒否・サービスオフとは区別し、設定変更を促さない', async () => {
      // 端末設定では解除できない制限なので、「設定アプリで許可してください」の
      // 案内に使われる 2 つのフラグは立ててはいけない。
      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissionDenied).toBe(false);
      expect(result.current.servicesDisabled).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('開発用の既定座標よりも年齢制限を優先する', async () => {
      mockedShouldUseDevDefaultLocation.mockReturnValue(true);

      const { result } = renderHook(() => useCurrentLocation());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.coords).toBeNull();
      expect(result.current.restrictedByAge).toBe(true);
    });

    it('成人として同意し直すと現在地の取得を開始する', async () => {
      mockedRequestPermissions.mockResolvedValue({
        status: 'granted',
      } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);
      mockedGetCurrentPosition.mockResolvedValue({ coords: sampleCoords, timestamp: 0 });

      const { result, rerender } = renderHook(() => useCurrentLocation());

      await waitFor(() => expect(result.current.restrictedByAge).toBe(true));
      expect(mockedRequestPermissions).not.toHaveBeenCalled();

      useAgeRestrictionStore.setState({ isAdult: true });
      rerender(undefined);

      await waitFor(() => expect(result.current.coords).toEqual(sampleCoords));
      expect(result.current.restrictedByAge).toBe(false);
    });
  });
});
