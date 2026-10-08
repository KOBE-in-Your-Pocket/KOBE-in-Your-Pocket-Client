import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { pickProfileIcon } from '../pick-profile-icon';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

const mockRequestPermission = jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync);
const mockLaunchLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockManipulate = jest.mocked(ImageManipulator.manipulate);

function assetOf(width: number, height: number, uri = 'file:///tmp/original.jpg') {
  return { uri, width, height };
}

function mockManipulateContext(savedUri: string) {
  const saveAsync = jest.fn().mockResolvedValue({ uri: savedUri, width: 1, height: 1 });
  const renderAsync = jest.fn().mockResolvedValue({ saveAsync });
  const resize = jest.fn();
  const context = { resize, renderAsync } as never;
  mockManipulate.mockReturnValue(context);
  return { resize, renderAsync, saveAsync };
}

describe('pickProfileIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('権限が拒否されたら permissionDenied を返し、ピッカーを開かない', async () => {
    mockRequestPermission.mockResolvedValue({ granted: false } as never);

    await expect(pickProfileIcon()).resolves.toEqual({ status: 'permissionDenied' });

    expect(mockLaunchLibrary).not.toHaveBeenCalled();
  });

  it('選択をキャンセルしたら canceled を返す', async () => {
    mockRequestPermission.mockResolvedValue({ granted: true } as never);
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null } as never);

    await expect(pickProfileIcon()).resolves.toEqual({ status: 'canceled' });

    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it('長辺が上限より大きい画像は上限に収まるよう resize してから JPEG 圧縮保存する', async () => {
    mockRequestPermission.mockResolvedValue({ granted: true } as never);
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [assetOf(2000, 1000)],
    } as never);
    const { resize, saveAsync } = mockManipulateContext('file:///tmp/processed.jpg');

    await expect(pickProfileIcon()).resolves.toEqual({
      status: 'picked',
      uri: 'file:///tmp/processed.jpg',
    });

    expect(mockManipulate).toHaveBeenCalledWith('file:///tmp/original.jpg');
    expect(resize).toHaveBeenCalledWith({ width: 512, height: 256 });
    expect(saveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: 0.8 });
  });

  it('既に上限以下の画像は resize せず圧縮保存だけする', async () => {
    mockRequestPermission.mockResolvedValue({ granted: true } as never);
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [assetOf(300, 200)],
    } as never);
    const { resize } = mockManipulateContext('file:///tmp/processed.jpg');

    await pickProfileIcon();

    expect(resize).not.toHaveBeenCalled();
  });

  it('寸法が取得できない画像（0x0）でも resize をスキップしてクラッシュしない', async () => {
    mockRequestPermission.mockResolvedValue({ granted: true } as never);
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [assetOf(0, 0)],
    } as never);
    const { resize } = mockManipulateContext('file:///tmp/processed.jpg');

    await expect(pickProfileIcon()).resolves.toEqual({
      status: 'picked',
      uri: 'file:///tmp/processed.jpg',
    });
    expect(resize).not.toHaveBeenCalled();
  });
});
