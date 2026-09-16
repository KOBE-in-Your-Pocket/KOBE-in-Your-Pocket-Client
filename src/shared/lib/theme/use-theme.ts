import { useColorScheme } from './use-color-scheme';

import { Colors } from '@/shared/config';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return Colors[theme];
}
