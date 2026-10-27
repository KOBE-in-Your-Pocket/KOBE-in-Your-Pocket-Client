import { fireEvent, render, screen } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { Text as MockText, View as MockView } from 'react-native';

import { IconCropScreen } from '../icon-crop-screen';

import type { ReactNode } from 'react';
import type { PanGesture, PinchGesture } from 'react-native-gesture-handler';

// Reanimated / Worklets はネイティブ部分が無いと読み込めないため、公式のモックへ差し替える。
// モックの withTiming は終了値をすぐ返すので、指を離した直後に範囲内へ戻った状態になる。
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/shared/lib/theme', () => ({
  useTheme: () => ({ background: '#FFFFFF' }),
}));

// shared/ui バレルは Reanimated / react-native-maps などネイティブ UI を含むため軽量スタブへ差し替える。
jest.mock('@/shared/ui', () => ({
  ThemedText: ({ children }: { children?: ReactNode }) => <MockText>{children}</MockText>,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: ReactNode }) => <MockView>{children}</MockView>,
}));

jest.mock('expo-image', () => ({ Image: () => null }));

// テスト環境の画面は 750x1334 なので、切り抜き枠の一辺は上限の 320 になる。
// 4000x3000 の画像は cover 相当で 426.7x320 に表示され、左右に 53.3 ずつ動かせる。
const LANDSCAPE = { uri: 'file:///tmp/landscape.jpg', width: 4000, height: 3000 };
const PORTRAIT = { uri: 'file:///tmp/portrait.jpg', width: 3000, height: 4000 };

function renderScreen(image = LANDSCAPE) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(<IconCropScreen image={image} onConfirm={onConfirm} onCancel={onCancel} />);
  return { onConfirm, onCancel };
}

function pressConfirm() {
  fireEvent.press(screen.getByLabelText('settings.accountEdit.iconCrop.confirm'));
}

function pan(translationX: number, translationY: number) {
  fireGestureHandler<PanGesture>(getByGestureTestId('icon-crop-pan'), [
    { state: State.BEGAN, translationX: 0, translationY: 0 },
    { state: State.ACTIVE, translationX: 0, translationY: 0 },
    { translationX, translationY },
    { state: State.END, translationX, translationY },
  ]);
}

// focal は操作エリアの中心（テストではレイアウトが無いので 0,0）に置き、枠の中心で拡大する。
function pinch(scale: number) {
  fireGestureHandler<PinchGesture>(getByGestureTestId('icon-crop-pinch'), [
    { state: State.BEGAN, scale: 1, focalX: 0, focalY: 0 },
    { state: State.ACTIVE, scale: 1, focalX: 0, focalY: 0 },
    { scale, focalX: 0, focalY: 0 },
    { state: State.END, scale, focalX: 0, focalY: 0 },
  ]);
}

describe('IconCropScreen', () => {
  it('キャンセルすると onCancel が呼ばれ、onConfirm は呼ばれない', () => {
    const { onConfirm, onCancel } = renderScreen();

    fireEvent.press(screen.getByLabelText('settings.cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('初期状態で決定すると、横長の画像の中央の正方形が返る', () => {
    const { onConfirm, onCancel } = renderScreen(LANDSCAPE);

    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({ originX: 500, originY: 0, width: 3000, height: 3000 });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('初期状態で決定すると、縦長の画像の中央の正方形が返る', () => {
    const { onConfirm } = renderScreen(PORTRAIT);

    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({ originX: 0, originY: 500, width: 3000, height: 3000 });
  });

  it('寸法を取得できない画像では null を返す', () => {
    const { onConfirm } = renderScreen({ uri: 'file:///tmp/unknown.jpg', width: 0, height: 0 });

    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  it('決定を続けて押しても onConfirm は 1 回だけ呼ばれる', () => {
    const { onConfirm } = renderScreen();

    pressConfirm();
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('枠の外まで右へドラッグすると、画像の左端が枠の左端で止まる', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pan(1000, 0);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({ originX: 0, originY: 0, width: 3000, height: 3000 });
  });

  it('枠の外まで左へドラッグすると、画像の右端が枠の右端で止まる', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pan(-1000, 0);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({
      originX: 1000,
      originY: 0,
      width: 3000,
      height: 3000,
    });
  });

  it('縦に余白がない画像は、上下にドラッグしても動かない', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pan(0, 200);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({ originX: 500, originY: 0, width: 3000, height: 3000 });
  });

  it('ピンチで 2 倍に拡大すると、中央の半分の大きさの範囲が返る', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pinch(2);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({
      originX: 1250,
      originY: 750,
      width: 1500,
      height: 1500,
    });
  });

  it('枠より小さく縮めると、指を離したとき枠が埋まる大きさに戻る', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pinch(0.3);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({ originX: 500, originY: 0, width: 3000, height: 3000 });
  });

  it('上限を超えて拡大すると、指を離したとき上限（4 倍）に戻る', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pinch(10);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({
      originX: 1625,
      originY: 1125,
      width: 750,
      height: 750,
    });
  });

  it('拡大したあとにドラッグすると、拡大した画像の端まで動かせる', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pinch(2);
    pan(1000, 1000);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({ originX: 0, originY: 0, width: 1500, height: 1500 });
  });

  // 決定時の計算でも範囲内に丸めるため、指を離した時点で戻っていることは、
  // 戻した位置から続けて操作した結果で確かめる。
  it('はみ出して指を離すと端まで戻り、次のドラッグはその位置から動く', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pan(1000, 0);
    // 右端（+53.3）まで戻っていれば、同じだけ左へ動かすと中央に来る。
    pan(-320 / 6, 0);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({ originX: 500, originY: 0, width: 3000, height: 3000 });
  });

  it('縮めすぎて指を離すと枠が埋まる大きさに戻り、次のピンチはそこから拡大する', () => {
    const { onConfirm } = renderScreen(LANDSCAPE);

    pinch(0.3);
    pinch(2);
    pressConfirm();

    expect(onConfirm).toHaveBeenCalledWith({
      originX: 1250,
      originY: 750,
      width: 1500,
      height: 1500,
    });
  });
});
