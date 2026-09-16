import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '../branding/animated-icon';

import { useFontsBootstrap } from './use-fonts-bootstrap';
import { useLanguageBootstrap } from './use-language-bootstrap';

import { useEvacuationDbBootstrap } from '@/features/evacuation/application/hooks/use-evacuation-db-bootstrap';
import { initI18n } from '@/shared/lib/i18n';
import { createQueryClient } from '@/shared/lib/query';

const i18n = initI18n();
const queryClient = createQueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  useLanguageBootstrap();
  useEvacuationDbBootstrap();
  useFontsBootstrap();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          {children}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
