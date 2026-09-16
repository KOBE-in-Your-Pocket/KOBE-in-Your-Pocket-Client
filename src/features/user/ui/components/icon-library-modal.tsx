import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

/**
 * アイコンに設定できるモック写真の一覧。
 * backend にアイコンアップロード API が未提供のため（#402 時点）、端末の
 * フォトライブラリではなくプリセットのモック写真から選ぶ。
 */
const MOCK_ICON_URLS = [1, 5, 8, 10, 16, 20, 25, 31, 38, 47, 56, 68].map(
  (n) => `https://i.pravatar.cc/150?img=${n}`,
);

const SELECTED_BORDER_COLOR = '#D45B45';

type IconLibraryModalProps = {
  visible: boolean;
  /** 現在選択中のアイコン URL。一覧内で強調表示する。 */
  selectedIconUrl: string;
  onSelect: (iconUrl: string) => void;
  onClose: () => void;
};

/** アイコンに使う写真をモック写真ライブラリから選ぶモーダル。 */
export function IconLibraryModal({
  visible,
  selectedIconUrl,
  onSelect,
  onClose,
}: IconLibraryModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="subtitle">{t('settings.accountEdit.iconLibraryTitle')}</ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.accountEdit.iconLibraryClose')}
              onPress={onClose}
              hitSlop={Spacing.two}
            >
              <ThemedText type="default" themeColor="textSecondary">
                {t('settings.accountEdit.iconLibraryClose')}
              </ThemedText>
            </Pressable>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {t('settings.accountEdit.iconLibraryDescription')}
          </ThemedText>
          <ScrollView>
            <View style={styles.grid}>
              {MOCK_ICON_URLS.map((url) => {
                const selected = url === selectedIconUrl;
                return (
                  <Pressable
                    key={url}
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.accountEdit.iconLibraryPhoto')}
                    accessibilityState={{ selected }}
                    onPress={() => onSelect(url)}
                    style={[
                      styles.photoFrame,
                      { borderColor: selected ? SELECTED_BORDER_COLOR : theme.backgroundElement },
                    ]}
                  >
                    <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  photoFrame: {
    borderWidth: 3,
    borderRadius: Spacing.two,
    padding: Spacing.half,
  },
  photo: {
    width: 88,
    height: 88,
    borderRadius: Spacing.one,
  },
});
