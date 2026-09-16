import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/shared/config';
import { LANGUAGE_AUTONYMS, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';
import { useTheme } from '@/shared/lib/theme';
import { useUiStore } from '@/shared/store';
import { ThemedText } from '@/shared/ui';

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);

  const handleSelect = useCallback(
    (next: SupportedLanguage) => {
      setLanguage(next);
      void i18n.changeLanguage(next);
    },
    [setLanguage, i18n],
  );

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {t('settings.language')}
      </ThemedText>
      <View style={styles.list}>
        {SUPPORTED_LANGUAGES.map((code) => {
          const selected = code === language;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => handleSelect(code)}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText type="default">{LANGUAGE_AUTONYMS[code]}</ThemedText>
              {selected ? (
                <ThemedText type="default" themeColor="textSecondary">
                  ✓
                </ThemedText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
});
