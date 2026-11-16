import { StyleSheet } from 'react-native';

import { MaxContentWidth, Spacing } from '@/shared/config';

/** 戻るボタン・案内のボタンの色（クレジット画面・サインインモーダルのアクセントカラーに合わせる）。 */
export const ACCENT_COLOR = '#C67B4A';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  backRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  backLabel: {
    color: ACCENT_COLOR,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  notice: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  noticeText: {
    textAlign: 'center',
  },
  noticeButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    backgroundColor: ACCENT_COLOR,
  },
  noticeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
