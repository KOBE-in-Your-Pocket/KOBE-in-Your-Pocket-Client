import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { LANGUAGE_AUTONYMS, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';
import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

export type ReviewLangFilter = 'all' | SupportedLanguage;

const FILTER_OPTIONS: ReviewLangFilter[] = ['all', ...SUPPORTED_LANGUAGES];

export function ReviewLanguageFilter({
  value,
  onChange,
}: {
  value: ReviewLangFilter;
  onChange: (v: ReviewLangFilter) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTER_OPTIONS.map((lang) => {
        const isSelected = lang === value;
        const label = lang === 'all' ? t('tourism.reviewFilter.all') : LANGUAGE_AUTONYMS[lang];
        return (
          <Pressable
            key={lang}
            style={[
              styles.chip,
              { backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement },
            ]}
            onPress={() => onChange(lang)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <ThemedText style={styles.chipText}>{label}</ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
  },
});
