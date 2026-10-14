import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

import { DISASTER_TYPES } from '../../domain/evacuation-shelter';
import { useDisasterFilterStore } from '../../store/use-disaster-filter-store';

import {
  SELECTED_CHIP_COLOR,
  SELECTED_CHIP_TEXT_COLOR,
  styles,
} from '../styles/disaster-filter.styles';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

/**
 * 避難所一覧の災害種別タグを表示するコンポーネント。
 *
 * 全災害種別を横スクロールで並べ、タップで `useDisasterFilterStore` の
 * selectedDisasters を切り替える。複数選択でき、何も選ばなければ全件表示になる。
 */
export function DisasterFilter() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { selectedDisasters, toggleDisaster } = useDisasterFilterStore();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.contentContainer}
    >
      {DISASTER_TYPES.map((disaster) => {
        const isSelected = selectedDisasters.includes(disaster);
        return (
          <Pressable
            key={disaster}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? SELECTED_CHIP_COLOR : theme.backgroundElement },
            ]}
            onPress={() => toggleDisaster(disaster)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <ThemedText
              style={[styles.chipText, isSelected ? { color: SELECTED_CHIP_TEXT_COLOR } : null]}
            >
              {t(`evacuation.disasterFilter.${disaster}`)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
