import { Pressable, View } from 'react-native';

import { styles } from './segmented-control.styles';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui/themed/themed-text';

export type Segment<T extends string> = {
  value: T;
  label: string;
  /**
   * 選択中セグメントの背景色。省略時はテーマの `backgroundSelected`（従来の見た目）。
   * 指定した場合は色付き背景とみなし、選択中の文字色を白にする。
   */
  selectedColor?: string;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  segmentMinWidth?: number;
  /** ドロップシャドウ（浮遊感）を付けるか。既定 true。false で影を消す。 */
  elevated?: boolean;
};

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  segmentMinWidth,
  elevated = true,
}: Props<T>) {
  const theme = useTheme();

  return (
    <View accessibilityRole="tablist">
      <View
        testID="segmented-control-track"
        style={[
          styles.track,
          elevated ? styles.trackElevated : undefined,
          { backgroundColor: theme.backgroundElement },
        ]}
      >
        {segments.map((seg) => {
          const isSelected = value === seg.value;
          const selectedBackground = seg.selectedColor ?? theme.backgroundSelected;
          // 色付き背景（selectedColor 指定時）はコントラスト確保のため文字を白にする。
          const onSelectedColor = seg.selectedColor ? '#FFFFFF' : undefined;
          return (
            <Pressable
              key={seg.value}
              style={[
                styles.segment,
                segmentMinWidth !== undefined ? { minWidth: segmentMinWidth } : undefined,
                isSelected ? { backgroundColor: selectedBackground } : undefined,
              ]}
              onPress={() => onChange(seg.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={seg.label}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  isSelected && onSelectedColor ? { color: onSelectedColor } : undefined,
                ]}
                type={isSelected ? 'smallBold' : 'small'}
                themeColor={isSelected ? 'text' : 'textSecondary'}
              >
                {seg.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
