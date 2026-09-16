import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

import { useGenreFilterStore } from '../../store/use-genre-filter-store';

import { SELECTED_CHIP_COLOR, styles } from '../styles/genre-filter.styles';

import type { SelectedGenre } from '../../store/use-genre-filter-store';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

const GENRES: SelectedGenre[] = ['all', 'landmark', 'nature', 'history', 'gourmet', 'onsen'];

/**
 * 観光スポット一覧のジャンル絞り込みチップを表示するコンポーネント。
 *
 * 「すべて」を含む全ジャンルを横スクロールで表示し、タップで
 * `useGenreFilterStore` の selectedGenre を更新する。
 */
export function GenreFilter() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { selectedGenre, setSelectedGenre } = useGenreFilterStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.contentContainer}
    >
      {GENRES.map((genre) => {
        const isSelected = genre === selectedGenre;
        return (
          <Pressable
            key={genre}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? SELECTED_CHIP_COLOR : theme.backgroundElement },
            ]}
            onPress={() => setSelectedGenre(genre)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <ThemedText style={styles.chipText}>{t(`tourism.genreFilter.${genre}`)}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
