import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    // 長い英語ラベルでも均等幅の flex 子が縮められるようにする。
    minWidth: 0,
  },
  tabButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
    // 透明の枠線で領域を確保し、フォーカス時に theme.primary の枠線へ切り替えてもレイアウトが動かないようにする。
    borderColor: 'transparent',
    width: '100%',
    maxWidth: '100%',
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  // フォントサイズは変えず太字だけで強調し、言語・フォーカス切替でレイアウトが動かないようにする。
  tabLabelFocused: {
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
