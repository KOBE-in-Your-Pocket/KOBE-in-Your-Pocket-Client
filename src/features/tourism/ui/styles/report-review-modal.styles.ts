import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const REPORT_ACCENT_COLOR = '#D45B45';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    alignSelf: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  options: {
    gap: Spacing.one,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: REPORT_ACCENT_COLOR,
  },
  description: {
    borderRadius: 8,
    padding: Spacing.two,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    minWidth: 96,
    alignItems: 'center',
  },
});
