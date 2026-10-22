import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

/** 発信ボタンの配色（iOS / Android 共通で青に揃える）。 */
export const CALL_BUTTON_COLOR = '#007AFF';

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
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: CALL_BUTTON_COLOR,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
