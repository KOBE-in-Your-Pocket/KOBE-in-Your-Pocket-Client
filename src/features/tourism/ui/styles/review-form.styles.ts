import { StyleSheet } from 'react-native';

import { Spacing } from '@/shared/config';

export const ACTIVE_STAR_COLOR = '#F5A623';
export const INACTIVE_STAR_COLOR = '#D8D8D8';

export const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  triggerText: {
    flex: 1,
  },
  loginNotice: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  form: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  starButton: {
    padding: Spacing.one,
  },
  textInput: {
    minHeight: 80,
    padding: Spacing.two,
    borderRadius: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#D45B45',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  actionButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
});
