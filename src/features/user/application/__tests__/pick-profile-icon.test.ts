import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { discardPickedProfileIcon, pickProfileIcon } from '../pick-profile-icon';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

const mockDelete = jest.fn();
let mockExists = true;
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    uri,
    get exists() {
      return mockExists;
    },
    delete: () => mockDelete(uri),
  })),
}));

const mockLaunchLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockFile = jest.mocked(File);

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
  });

  it('選んだ画像の uri・寸法を加工せずにそのまま返す', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/original.jpg', width: 900, height: 1200, fileName: 'a.jpg' }],
    } as never);

    await expect(pickProfileIcon()).resolves.toEqual({
      status: 'picked',
      image: { uri: 'file:///tmp/original.jpg', width: 900, height: 1200 },
    });
  });

  it('選んだだけでは元画像を削除しない', async () => {
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/original.jpg', width: 900, height: 1200 }],
    } as never);

    await pickProfileIcon();

    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe('discardPickedProfileIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExists = true;
  });

  it('元画像の一時ファイルを削除する', () => {
    discardPickedProfileIcon({ uri: 'file:///tmp/original.jpg' });

    expect(mockFile).toHaveBeenCalledWith('file:///tmp/original.jpg');
    expect(mockDelete).toHaveBeenCalledWith('file:///tmp/original.jpg');
  });

  it('ファイルがすでに無ければ何もしない', () => {
    mockExists = false;

    discardPickedProfileIcon({ uri: 'file:///tmp/original.jpg' });

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('削除に失敗しても例外を投げない', () => {
    mockDelete.mockImplementationOnce(() => {
      throw new Error('delete failed');
    });

    expect(() => discardPickedProfileIcon({ uri: 'file:///tmp/original.jpg' })).not.toThrow();
  });
});
