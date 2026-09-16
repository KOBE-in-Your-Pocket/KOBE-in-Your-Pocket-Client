import { Pressable, View } from 'react-native';

import { ThemedText } from '@/shared/ui';

import { styles } from '../styles/filter-group.styles';

/** 絞り込み1軸分の選択肢。`value` はストアのキー、`label` は表示名、`selectedColor` は選択時の塗り色。 */
export type FilterOption<T extends string> = {
  value: T;
  label: string;
  selectedColor: string;
};

type FilterGroupProps<T extends string> = {
  /** 見出しバッジに表示する名前（例: カテゴリー / 対象）。 */
  label: string;
  options: readonly FilterOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

/**
 * 「見出しバッジ＋選択タブ」の2行構成で1つの絞り込み軸を中央揃えで表示する汎用コンポーネント。
 *
 * 1行目にオレンジの見出しバッジ、2行目に間隔を空けた独立タブを中央揃えで並べる（連結させず
 * 押し分けやすくする）。選択中タブは選択肢ごとの色（{@link FilterOption.selectedColor}）で塗り、
 * 文字を白にする。カテゴリー絞り込み（{@link KindFilter}）と対象絞り込み（{@link ScopeFilter}）で共有する。
 */
export function FilterGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: FilterGroupProps<T>) {
  return (
    <View style={styles.group}>
      <View style={styles.badge}>
        <ThemedText style={styles.badgeText}>{label}</ThemedText>
      </View>
      <View style={styles.tagRow}>
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.tag,
                isSelected ? { backgroundColor: option.selectedColor } : undefined,
              ]}
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
            >
              <ThemedText style={[styles.tagText, isSelected ? styles.tagTextSelected : undefined]}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
