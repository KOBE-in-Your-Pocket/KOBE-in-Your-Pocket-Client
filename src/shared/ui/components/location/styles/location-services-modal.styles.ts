import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** プライマリアクションの配色（スポットカードのアクセントカラーに合わせる）。 */
export const ACCENT_COLOR = '#C67B4A';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  title: {
    marginBottom: Spacing.two,
  },
  message: {
    marginBottom: Spacing.four,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: ACCENT_COLOR,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: ACCENT_COLOR,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
