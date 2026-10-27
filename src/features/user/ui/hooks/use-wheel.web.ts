import { useEffect, useEffectEvent, type RefObject } from 'react';

import type { View } from 'react-native';

/**
 * `ref` の要素の上でのマウスホイールの回転（`deltaY`）を受け取る（#719）。
 * トラックパッドのピンチも、ブラウザからは ctrlKey 付きのホイールとして届く。
 *
 * React の `onWheel` は passive で登録されページのスクロールを止められないため、
 * DOM 要素に `passive: false` で直接登録する。react-native-web では View の ref が DOM 要素になる。
 */
export function useWheel(
  ref: RefObject<View | null>,
  onWheel: (deltaY: number) => void,
  enabled: boolean,
): void {
  const handleWheel = useEffectEvent((event: WheelEvent) => {
    // ページのスクロールや、ブラウザ自体の拡大を止める。
    event.preventDefault();
    onWheel(event.deltaY);
  });

  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!enabled || !node) {
      return;
    }
    const listener = (event: WheelEvent) => handleWheel(event);
    node.addEventListener('wheel', listener, { passive: false });
    return () => node.removeEventListener('wheel', listener);
  }, [ref, enabled]);
}
