import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { cropProfileIcon } from '../crop-profile-icon';
import { discardPickedProfileIcon } from '../pick-profile-icon';

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('../pick-profile-icon', () => ({
  discardPickedProfileIcon: jest.fn(),
}));

const mockManipulate = jest.mocked(ImageManipulator.manipulate);
const mockDiscard = jest.mocked(discardPickedProfileIcon);

const IMAGE = { uri: 'file:///tmp/original.jpg', width: 900, height: 1200 };
const CROP = { originX: 0, originY: 150, width: 900, height: 900 };

function mockManipulateContext(savedUri = 'file:///tmp/processed.jpg') {
  const saveAsync = jest.fn().mockResolvedValue({ uri: savedUri, width: 512, height: 512 });
  const renderAsync = jest.fn().mockResolvedValue({ saveAsync });
  const crop = jest.fn();
  const resize = jest.fn();
  const context = { crop, resize, renderAsync } as never;
  mockManipulate.mockReturnValue(context);
  return { crop, resize, renderAsync, saveAsync };
}

describe('cropProfileIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('切り抜き範囲で crop してから 512px 四方に resize し、JPEG（0.8）で保存する', async () => {
    const { crop, resize, saveAsync } = mockManipulateContext();

    await expect(cropProfileIcon(IMAGE, CROP)).resolves.toBe('file:///tmp/processed.jpg');

    expect(mockManipulate).toHaveBeenCalledWith('file:///tmp/original.jpg');
    expect(crop).toHaveBeenCalledWith(CROP);
    expect(resize).toHaveBeenCalledWith({ width: 512, height: 512 });
    expect(crop.mock.invocationCallOrder[0]).toBeLessThan(resize.mock.invocationCallOrder[0]);
    expect(saveAsync).toHaveBeenCalledWith({ format: SaveFormat.JPEG, compress: 0.8 });
  });

  it('切り抜き範囲が 512px より小さくても 512px 四方にする', async () => {
    const { resize } = mockManipulateContext();

    await cropProfileIcon(IMAGE, { originX: 10, originY: 20, width: 128, height: 128 });

    expect(resize).toHaveBeenCalledWith({ width: 512, height: 512 });
  });

  it('切り抜き範囲が無い（寸法を取得できない）ときは、切り抜かず幅だけ指定して resize する', async () => {
    const { crop, resize } = mockManipulateContext();

    await cropProfileIcon({ ...IMAGE, width: 0, height: 0 }, null);

    expect(crop).not.toHaveBeenCalled();
    expect(resize).toHaveBeenCalledWith({ width: 512 });
  });

  it('保存できたら元画像の一時ファイルを削除する', async () => {
    const { saveAsync } = mockManipulateContext();

    await cropProfileIcon(IMAGE, CROP);

    expect(mockDiscard).toHaveBeenCalledWith(IMAGE);
    expect(mockDiscard.mock.invocationCallOrder[0]).toBeGreaterThan(
      saveAsync.mock.invocationCallOrder[0],
    );
  });

  it('保存に失敗したら元画像を残して例外を投げる（やり直しやキャンセル時の削除は呼び出し側）', async () => {
    const { saveAsync } = mockManipulateContext();
    saveAsync.mockRejectedValue(new Error('save failed'));

    await expect(cropProfileIcon(IMAGE, CROP)).rejects.toThrow('save failed');

    expect(mockDiscard).not.toHaveBeenCalled();
  });
});
