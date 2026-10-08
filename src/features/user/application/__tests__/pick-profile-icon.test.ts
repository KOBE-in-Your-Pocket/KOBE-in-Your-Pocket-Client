import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { pickProfileIcon } from '../pick-profile-icon';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

const mockDelete = jest.fn();
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    exists: true,
    delete: () => mockDelete(uri),
  })),
}));

const mockLaunchLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockManipulate = jest.mocked(ImageManipulator.manipulate);
const mockFile = jest.mocked(File);

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

  it('権限を事前に要求せず、直接ピッカーを開く', async () => {
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null } as never);

    await pickProfileIcon();

    expect(mockLaunchLibrary).toHaveBeenCalledTimes(1);
  });

  it('選択をキャンセルしたら canceled を返す', async () => {
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null } as never);

    await expect(pickProfileIcon()).resolves.toEqual({ status: 'canceled' });

    expect(mockManipulate).not.toHaveBeenCalled();
  });

  it('横長で長辺が上限より大きい画像は、幅だけ指定して resize する', async () => {
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
    expect(resize).toHaveBeenCalledWith({ width: 512 });
    expect(saveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: 0.8 });
  });

  it('縦長で長辺が上限より大きい画像は、高さだけ指定して resize する', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [assetOf(1000, 2000)],
    } as never);
    const { resize } = mockManipulateContext('file:///tmp/processed.jpg');

    await pickProfileIcon();

    expect(resize).toHaveBeenCalledWith({ height: 512 });
  });

  it('既に上限以下の画像は resize せず圧縮保存だけする', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [assetOf(300, 200)],
    } as never);
    const { resize } = mockManipulateContext('file:///tmp/processed.jpg');

    await pickProfileIcon();

    expect(resize).not.toHaveBeenCalled();
  });

  it('寸法が取得できない画像（0x0）は、幅だけ指定して防御的に resize する', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [assetOf(0, 0)],
    } as never);
    const { resize } = mockManipulateContext('file:///tmp/processed.jpg');

    await expect(pickProfileIcon()).resolves.toEqual({
      status: 'picked',
      uri: 'file:///tmp/processed.jpg',
    });
    expect(resize).toHaveBeenCalledWith({ width: 512 });
  });

  it('加工が終わったら、選択直後の元画像（フルサイズ）を削除する', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [assetOf(2000, 1000, 'file:///tmp/picker-original.jpg')],
    } as never);
    mockManipulateContext('file:///tmp/processed.jpg');

    await pickProfileIcon();

    expect(mockFile).toHaveBeenCalledWith('file:///tmp/picker-original.jpg');
    expect(mockDelete).toHaveBeenCalledWith('file:///tmp/picker-original.jpg');
  });
});
