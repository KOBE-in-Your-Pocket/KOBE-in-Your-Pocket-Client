import {
  clampIconCropTransform,
  clampIconZoom,
  computeIconCropRect,
  getMaxIconZoom,
  INITIAL_ICON_CROP_TRANSFORM,
  isUsableIconImageSize,
  MAX_ICON_ZOOM,
  MIN_ICON_CROP_EDGE_PX,
  zoomIconCropTransform,
  type IconCropRect,
  type IconImageSize,
} from '../icon-crop';

/** 切り抜き枠の一辺（pt）。 */
const FRAME = 300;

const SQUARE: IconImageSize = { width: 1000, height: 1000 };
const PORTRAIT: IconImageSize = { width: 900, height: 1200 };
const LANDSCAPE: IconImageSize = { width: 1200, height: 900 };

function expectInside(rect: IconCropRect | null, image: IconImageSize) {
  expect(rect).not.toBeNull();
  const r = rect!;
  expect(Number.isInteger(r.originX)).toBe(true);
  expect(Number.isInteger(r.originY)).toBe(true);
  expect(Number.isInteger(r.width)).toBe(true);
  expect(r.width).toBe(r.height);
  expect(r.width).toBeGreaterThanOrEqual(1);
  expect(r.originX).toBeGreaterThanOrEqual(0);
  expect(r.originY).toBeGreaterThanOrEqual(0);
  expect(r.originX + r.width).toBeLessThanOrEqual(image.width);
  expect(r.originY + r.height).toBeLessThanOrEqual(image.height);
}

describe('isUsableIconImageSize', () => {
  it('幅・高さが正の整数なら使える', () => {
    expect(isUsableIconImageSize(PORTRAIT)).toBe(true);
  });

  it('0・負の数・NaN・Infinity は使えない', () => {
    expect(isUsableIconImageSize({ width: 0, height: 1200 })).toBe(false);
    expect(isUsableIconImageSize({ width: 900, height: 0 })).toBe(false);
    expect(isUsableIconImageSize({ width: -1, height: 1200 })).toBe(false);
    expect(isUsableIconImageSize({ width: NaN, height: 1200 })).toBe(false);
    expect(isUsableIconImageSize({ width: Infinity, height: 1200 })).toBe(false);
  });

  it('小数の寸法は使えない', () => {
    expect(isUsableIconImageSize({ width: 0.5, height: 0.7 })).toBe(false);
    expect(isUsableIconImageSize({ width: 1000.5, height: 1000 })).toBe(false);
  });
});

describe('getMaxIconZoom', () => {
  it('十分大きい画像は MAX_ICON_ZOOM', () => {
    expect(getMaxIconZoom(SQUARE)).toBe(MAX_ICON_ZOOM);
  });

  it('切り抜きの一辺が MIN_ICON_CROP_EDGE_PX を下回らない倍率に抑える', () => {
    expect(getMaxIconZoom({ width: 256, height: 400 })).toBe(256 / MIN_ICON_CROP_EDGE_PX);
  });

  it('とても小さい画像でも 1 未満にはしない', () => {
    expect(getMaxIconZoom({ width: 50, height: 50 })).toBe(1);
  });

  it('寸法が使えないときは 1', () => {
    expect(getMaxIconZoom({ width: NaN, height: 400 })).toBe(1);
    expect(getMaxIconZoom({ width: 400, height: 0 })).toBe(1);
    expect(getMaxIconZoom({ width: Infinity, height: 400 })).toBe(1);
  });
});

describe('clampIconZoom', () => {
  it('範囲内はそのまま', () => {
    expect(clampIconZoom(2.5, SQUARE)).toBe(2.5);
  });

  it('1 未満は 1、上限超えは上限に丸める', () => {
    expect(clampIconZoom(0.3, SQUARE)).toBe(1);
    expect(clampIconZoom(10, SQUARE)).toBe(MAX_ICON_ZOOM);
  });

  it('NaN は 1 にする', () => {
    expect(clampIconZoom(NaN, SQUARE)).toBe(1);
  });

  it('画像の寸法が使えないときは 1 にする', () => {
    expect(clampIconZoom(2.5, { width: NaN, height: 400 })).toBe(1);
  });
});

describe('clampIconCropTransform', () => {
  it('初期状態はそのまま', () => {
    expect(clampIconCropTransform(INITIAL_ICON_CROP_TRANSFORM, PORTRAIT, FRAME)).toEqual(
      INITIAL_ICON_CROP_TRANSFORM,
    );
  });

  it('cover 相当では短辺方向に動かせない', () => {
    // 縦長：横幅が枠にぴったり、縦は 400pt で上下に 50pt ずつ動かせる
    expect(
      clampIconCropTransform({ scale: 1, translateX: 30, translateY: 500 }, PORTRAIT, FRAME),
    ).toEqual({ scale: 1, translateX: 0, translateY: 50 });
    // 横長：縦が枠にぴったり、横は左右に 50pt ずつ
    expect(
      clampIconCropTransform({ scale: 1, translateX: -500, translateY: -30 }, LANDSCAPE, FRAME),
    ).toEqual({ scale: 1, translateX: -50, translateY: 0 });
  });

  it('拡大すると動かせる範囲が広がる', () => {
    // 2 倍：表示 600pt 四方、左右上下に 150pt ずつ
    expect(
      clampIconCropTransform({ scale: 2, translateX: 1000, translateY: -1000 }, SQUARE, FRAME),
    ).toEqual({ scale: 2, translateX: 150, translateY: -150 });
  });

  it('倍率を先に収めてから移動量を収める', () => {
    expect(
      clampIconCropTransform({ scale: 10, translateX: 1000, translateY: 0 }, SQUARE, FRAME),
    ).toEqual({ scale: MAX_ICON_ZOOM, translateX: 450, translateY: 0 });
  });

  it('寸法や枠が使えないときは初期状態を返す', () => {
    const moved = { scale: 2, translateX: 10, translateY: 10 };
    expect(clampIconCropTransform(moved, { width: 0, height: 0 }, FRAME)).toEqual(
      INITIAL_ICON_CROP_TRANSFORM,
    );
    expect(clampIconCropTransform(moved, SQUARE, 0)).toEqual(INITIAL_ICON_CROP_TRANSFORM);
    expect(clampIconCropTransform(moved, SQUARE, Infinity)).toEqual(INITIAL_ICON_CROP_TRANSFORM);
    expect(clampIconCropTransform(moved, SQUARE, NaN)).toEqual(INITIAL_ICON_CROP_TRANSFORM);
  });

  it('初期状態を返すときは共有の定数そのものではなくコピーを返す', () => {
    const result = clampIconCropTransform(INITIAL_ICON_CROP_TRANSFORM, SQUARE, 0);
    expect(result).not.toBe(INITIAL_ICON_CROP_TRANSFORM);
    result.translateX = 99;
    expect(INITIAL_ICON_CROP_TRANSFORM.translateX).toBe(0);
  });
});

describe('zoomIconCropTransform', () => {
  it('中央に置いたまま倍率を変えると、中央のまま拡大する', () => {
    expect(zoomIconCropTransform(INITIAL_ICON_CROP_TRANSFORM, 2, LANDSCAPE, FRAME)).toEqual({
      scale: 2,
      translateX: 0,
      translateY: 0,
    });
  });

  it('枠の中心に見えている部分を保つよう、移動量も倍率に合わせて変える', () => {
    // 2 倍のとき横に (1200*(300/900)*2 - 300)/2 = 250 まで動かせる。
    const zoomed = zoomIconCropTransform(
      { scale: 2, translateX: 100, translateY: -100 },
      3,
      LANDSCAPE,
      FRAME,
    );

    expect(zoomed.scale).toBe(3);
    expect(zoomed.translateX).toBeCloseTo(150);
    expect(zoomed.translateY).toBeCloseTo(-150);
  });

  it('縮小して余白ができる移動量は、範囲内に収める', () => {
    // 1 倍のとき横は 50 まで、縦は 0 までしか動かせない。
    expect(
      zoomIconCropTransform({ scale: 2, translateX: 200, translateY: 200 }, 1, LANDSCAPE, FRAME),
    ).toEqual({ scale: 1, translateX: 50, translateY: 0 });
  });

  it('倍率は 1 〜 上限に収める', () => {
    expect(zoomIconCropTransform(INITIAL_ICON_CROP_TRANSFORM, 0.2, SQUARE, FRAME).scale).toBe(1);
    expect(zoomIconCropTransform(INITIAL_ICON_CROP_TRANSFORM, 100, SQUARE, FRAME).scale).toBe(
      getMaxIconZoom(SQUARE),
    );
  });

  it('元の倍率が壊れているときは、中央に戻す', () => {
    expect(
      zoomIconCropTransform({ scale: 0, translateX: 30, translateY: 0 }, 2, LANDSCAPE, FRAME),
    ).toEqual({ scale: 2, translateX: 0, translateY: 0 });
  });
});

describe('computeIconCropRect', () => {
  it('初期状態では中央の正方形（短辺いっぱい）', () => {
    expect(computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, SQUARE, FRAME)).toEqual({
      originX: 0,
      originY: 0,
      width: 1000,
      height: 1000,
    });
    expect(computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, PORTRAIT, FRAME)).toEqual({
      originX: 0,
      originY: 150,
      width: 900,
      height: 900,
    });
    expect(computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, LANDSCAPE, FRAME)).toEqual({
      originX: 150,
      originY: 0,
      width: 900,
      height: 900,
    });
  });

  it('拡大すると中央の小さい範囲になる', () => {
    expect(computeIconCropRect({ scale: 2, translateX: 0, translateY: 0 }, SQUARE, FRAME)).toEqual({
      originX: 250,
      originY: 250,
      width: 500,
      height: 500,
    });
  });

  it('画像を右下へずらすと、元画像の左上側が切り抜かれる', () => {
    // 2 倍で端まで（150pt）動かすと左上の角
    expect(
      computeIconCropRect({ scale: 2, translateX: 150, translateY: 150 }, SQUARE, FRAME),
    ).toEqual({ originX: 0, originY: 0, width: 500, height: 500 });
    // 縦長で下へ端まで動かすと上端
    expect(
      computeIconCropRect({ scale: 1, translateX: 0, translateY: 50 }, PORTRAIT, FRAME),
    ).toEqual({ originX: 0, originY: 0, width: 900, height: 900 });
  });

  it('画像を左上へずらすと、元画像の右下側が切り抜かれる', () => {
    expect(
      computeIconCropRect({ scale: 2, translateX: -150, translateY: -150 }, SQUARE, FRAME),
    ).toEqual({ originX: 500, originY: 500, width: 500, height: 500 });
    expect(
      computeIconCropRect({ scale: 1, translateX: -50, translateY: 0 }, LANDSCAPE, FRAME),
    ).toEqual({ originX: 300, originY: 0, width: 900, height: 900 });
  });

  it('範囲外の倍率・移動量は収めてから計算する', () => {
    expect(
      computeIconCropRect({ scale: 10, translateX: -9999, translateY: 9999 }, SQUARE, FRAME),
    ).toEqual({ originX: 750, originY: 0, width: 250, height: 250 });
  });

  it('寸法や枠が使えないときは null', () => {
    expect(
      computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, { width: 0, height: 1200 }, FRAME),
    ).toBeNull();
    expect(computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, PORTRAIT, 0)).toBeNull();
    expect(computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, PORTRAIT, Infinity)).toBeNull();
    expect(computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, PORTRAIT, NaN)).toBeNull();
    expect(
      computeIconCropRect(INITIAL_ICON_CROP_TRANSFORM, { width: 1000.5, height: 1000 }, FRAME),
    ).toBeNull();
  });

  it('端数が出る寸法・倍率でも 1px もはみ出さない', () => {
    const images: IconImageSize[] = [
      { width: 1001, height: 999 },
      { width: 333, height: 777 },
      { width: 4032, height: 3024 },
      { width: 129, height: 5000 },
      { width: 1, height: 1 },
    ];
    const scales = [1, 1.3333, 2.71, MAX_ICON_ZOOM];
    const offsets = [-10000, -123.456, -0.5, 0, 0.5, 77.7, 10000];

    for (const image of images) {
      for (const scale of scales) {
        for (const translateX of offsets) {
          for (const translateY of offsets) {
            expectInside(
              computeIconCropRect({ scale, translateX, translateY }, image, 287.5),
              image,
            );
          }
        }
      }
    }
  });
});
