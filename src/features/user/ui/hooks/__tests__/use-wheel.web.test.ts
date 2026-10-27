import { renderHook } from '@testing-library/react-native';

import { useWheel } from '../use-wheel.web';

import type { RefObject } from 'react';
import type { View } from 'react-native';

// react-native-web では View の ref が DOM 要素になる。テストでは EventTarget で代用する。
function createTarget() {
  const target = new EventTarget();
  const ref = { current: target as unknown as View } as RefObject<View | null>;
  return { target, ref };
}

function wheel(target: EventTarget, deltaY: number): Event {
  const event = Object.assign(new Event('wheel', { cancelable: true }), { deltaY });
  target.dispatchEvent(event);
  return event;
}

describe('useWheel（Web）', () => {
  it('ホイールの回転量を渡し、ページのスクロールを止める', () => {
    const { target, ref } = createTarget();
    const onWheel = jest.fn();
    renderHook(() => useWheel(ref, onWheel, true));

    const event = wheel(target, 120);

    expect(onWheel).toHaveBeenCalledWith(120);
    expect(event.defaultPrevented).toBe(true);
  });

  it('無効のときは受け取らず、スクロールも止めない', () => {
    const { target, ref } = createTarget();
    const onWheel = jest.fn();
    renderHook(() => useWheel(ref, onWheel, false));

    const event = wheel(target, 120);

    expect(onWheel).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('アンマウントしたら受け取らない', () => {
    const { target, ref } = createTarget();
    const onWheel = jest.fn();
    const { unmount } = renderHook(() => useWheel(ref, onWheel, true));

    unmount();
    wheel(target, 120);

    expect(onWheel).not.toHaveBeenCalled();
  });

  it('再描画で渡し直したコールバックを使う', () => {
    const { target, ref } = createTarget();
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ onWheel }) => useWheel(ref, onWheel, true), {
      initialProps: { onWheel: first },
    });

    rerender({ onWheel: second });
    wheel(target, -40);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(-40);
  });
});
