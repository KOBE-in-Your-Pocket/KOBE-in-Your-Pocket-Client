import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  SHELTER_RADIUS_OPTIONS_KM,
  useShelterRadiusStore,
} from '../../store/use-shelter-radius-store';

import {
  RADIUS_SELECTED_BACKGROUND,
  RADIUS_SELECTED_COLOR,
  styles,
} from '../styles/shelter-radius-modal.styles';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

/** `SHELTER_RADIUS_OPTIONS_KM` の各値に使う i18n キー（`evacuation.radiusFilter.options.*`）。 */
const RADIUS_OPTION_LABEL_KEYS: Record<string, string> = {
  '1': '1km',
  '3': '3km',
  '5': '5km',
  null: 'unlimited',
};

/**
 * 避難所マップの表示半径を設定するモーダル。マップ画面右上のハンバーガーメニューから開く。
 *
 * 選択は `useShelterRadiusStore` に即時反映され、地図の避難所ピンの絞り込みに使われる。
 */
export function ShelterRadiusModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const selectedRadiusKm = useShelterRadiusStore((state) => state.selectedRadiusKm);
  const setSelectedRadiusKm = useShelterRadiusStore((state) => state.setSelectedRadiusKm);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* 暗幕のタップで閉じる。シート内のタップは下の Pressable が吸収して閉じないようにする。 */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}}>
          <ThemedView type="background" style={styles.sheet}>
            <View style={[styles.headerRow, { paddingTop: insets.top + Spacing.three }]}>
              <ThemedText type="subtitle">{t('evacuation.radiusFilter.title')}</ThemedText>
              <Pressable
                style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('evacuation.radiusFilter.close')}
              >
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={16}
                />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <View accessibilityRole="radiogroup">
                {SHELTER_RADIUS_OPTIONS_KM.map((radiusKm) => {
                  const isSelected = radiusKm === selectedRadiusKm;
                  const label = t(
                    `evacuation.radiusFilter.options.${RADIUS_OPTION_LABEL_KEYS[String(radiusKm)]}`,
                  );
                  return (
                    <Pressable
                      key={String(radiusKm)}
                      style={[
                        styles.row,
                        {
                          backgroundColor: isSelected
                            ? RADIUS_SELECTED_BACKGROUND
                            : theme.backgroundElement,
                        },
                      ]}
                      onPress={() => setSelectedRadiusKm(radiusKm)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={label}
                    >
                      <ThemedText
                        style={[
                          styles.rowLabel,
                          isSelected ? { color: RADIUS_SELECTED_COLOR } : undefined,
                        ]}
                      >
                        {label}
                      </ThemedText>
                      {isSelected ? (
                        <SymbolView
                          tintColor={RADIUS_SELECTED_COLOR}
                          name={{
                            ios: 'checkmark.circle.fill',
                            android: 'check_circle',
                            web: 'check_circle',
                          }}
                          size={22}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
