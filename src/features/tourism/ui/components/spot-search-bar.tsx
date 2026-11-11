import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSpotSearchStore } from '../../store/use-spot-search-store';

import { styles } from '../styles/spot-search-bar.styles';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';

/**
 * 地図画面（観光モード）上部に表示する、スポット名での検索バー。
 * 入力中のキーワードは {@link useSpotSearchStore} で保持し、× ボタンで消去できる。
 */
export function SpotSearchBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyword = useSpotSearchStore((state) => state.keyword);
  const setKeyword = useSpotSearchStore((state) => state.setKeyword);

  const handleClear = () => setKeyword('');

  return (
    <View
      style={[
        styles.container,
        { top: insets.top + Spacing.three, backgroundColor: theme.backgroundElement },
      ]}
    >
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={keyword}
        onChangeText={setKeyword}
        placeholder={t('map.search.placeholder')}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={t('map.search.placeholder')}
        returnKeyType="search"
      />

      {keyword.length > 0 && (
        <Pressable
          style={styles.clearButton}
          hitSlop={8}
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel={t('map.search.clear')}
        >
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={18}
          />
        </Pressable>
      )}
    </View>
  );
}
