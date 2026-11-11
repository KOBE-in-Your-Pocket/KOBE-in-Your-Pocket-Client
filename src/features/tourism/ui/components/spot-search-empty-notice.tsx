import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { filterSpotsByKeyword } from '../../application/use-filtered-spots';
import { useSpots } from '../../application/use-spots';
import { useSpotSearchStore } from '../../store/use-spot-search-store';

import { SEARCH_BAR_HEIGHT } from '../styles/spot-search-bar.styles';
import { styles } from '../styles/spot-search-empty-notice.styles';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

/**
 * 検索キーワードに一致するスポットが0件のとき、検索バー直下に案内を表示する（#788）。
 */
export function SpotSearchEmptyNotice() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyword = useSpotSearchStore((state) => state.keyword);
  const { data: spots, isPending, isError } = useSpots();

  const hasNoResults = useMemo(
    () =>
      keyword.trim() !== '' &&
      !isPending &&
      !isError &&
      filterSpotsByKeyword(spots ?? [], keyword).length === 0,
    [spots, keyword, isPending, isError],
  );

  if (!hasNoResults) return null;

  return (
    <ThemedText
      themeColor="textSecondary"
      style={[
        styles.container,
        {
          top: insets.top + Spacing.three + SEARCH_BAR_HEIGHT + Spacing.two,
          backgroundColor: theme.backgroundElement,
        },
      ]}
    >
      {t('map.search.noResults')}
    </ThemedText>
  );
}
