import type { RefObject } from 'react';
import type { View } from 'react-native';

/**
 * マウスホイールの回転を受け取る（#719）。ネイティブにはホイールが無いので何もしない。
 * Web の実装は `use-wheel.web.ts`。
 */
export function useWheel(
  _ref: RefObject<View | null>,
  _onWheel: (deltaY: number) => void,
  _enabled: boolean,
): void {}
