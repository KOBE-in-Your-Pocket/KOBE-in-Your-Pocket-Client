import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedView } from '@/shared/ui';

import { ListGenreFilter } from './list-genre-filter';
import { ListModeToggle } from './list-mode-toggle';
import { SwitchableList } from './switchable-list';

/**
 * 観光スポット・避難所の一覧画面。
 *
 * 画面上部の装飾タイトルは置かない。どの画面かは下のタブで分かり、
 * タイトルの分だけ一覧を広く見せるため。ジャンルの絞り込みを一番上に置く。
 */
export function ListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          // 上端の余白は、ホーム画面のタイトル位置（SafeArea + padding 24 + marginTop 4）と揃える。
          {
            paddingTop: insets.top + Spacing.four + Spacing.one,
            backgroundColor: theme.background,
          },
        ]}
      >
        <ListGenreFilter />
      </View>
      <SwitchableList />
      {/* モードトグルは右下に固定表示（スクロールに追従しないようリストの外＝container 直下に置く）。 */}
      <ListModeToggle />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
});
