import { StyleSheet } from 'react-native';

/**
 * Android の `Alert`（AppCompat の AlertDialog）を実測して寄せた配色（Pixel 8 / API 34）。
 * 経路案内の確認ダイアログ（`confirmOpenDirections`）と見た目を揃えるため。
 * `call` だけは OS 標準に無い色で、「発信する」を青く目立たせる。
 */
export const ANDROID_ALERT_COLORS = {
  light: {
    background: '#FFFFFF',
    text: '#212121',
    /** AppCompat 既定のアクセントカラー（キャンセル等のボタン文字色）。 */
    button: '#008577',
    call: '#007AFF',
  },
  dark: {
    background: '#424242',
    text: '#FFFFFF',
    button: '#80CBC4',
    call: '#64B5F6',
  },
} as const;

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 26.6,
  },
  card: {
    borderRadius: 2,
    elevation: 24,
  },
  title: {
    paddingTop: 18,
    paddingHorizontal: 24,
    fontSize: 20,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 8,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
