import { useTranslation } from 'react-i18next';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/shared/config';
import { ThemedText } from '../../themed/themed-text';
import { ThemedView } from '../../themed/themed-view';

export type LocationPermissionNoticeProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * 位置情報の権限が拒否されたときに表示する注意文バナー。
 * 現在地ピンを出せない理由をユーザーに伝える。
 */
export function LocationPermissionNotice({ style }: LocationPermissionNoticeProps) {
  const { t } = useTranslation();

  return (
    <ThemedView type="backgroundElement" style={[styles.banner, style]}>
      <ThemedText type="smallBold">{t('location.permissionDeniedNotice')}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
