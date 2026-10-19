import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKindFilterStore, type SelectedKind } from '../../store/use-kind-filter-store';
import { useScopeFilterStore, type SelectedScope } from '../../store/use-scope-filter-store';

import {
  FILTER_SELECTED_BACKGROUND,
  FILTER_SELECTED_COLOR,
  styles,
} from '../styles/manner-filter-modal.styles';

import { Spacing } from '@/shared/config';
import { useTheme } from '@/shared/lib/theme';
import { ThemedText, ThemedView } from '@/shared/ui';

/** カテゴリー（種別）の選択肢と表示順（全て・ルール・マナー）。 */
const KINDS: SelectedKind[] = ['all', 'rule', 'manner'];
/** 対象（地域スコープ）の選択肢と表示順（全て・各所・全国）。 */
const SCOPES: SelectedScope[] = ['all', 'local', 'japan'];

type FilterSectionProps<T extends string> = {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
};

/**
 * 1 軸分のセクション。見出し＋選択肢の行リストを表示する。
 * 選択中は青背景＋青文字＋チェックアイコンで強調し、未選択はテーマの要素背景色にする。
 * 先頭の「すべて」を選ぶとその軸の絞り込みが解除される（＝クリア導線）。
 */
function FilterSection<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: FilterSectionProps<T>) {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup">
      <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
        {label}
      </ThemedText>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.row,
              {
                backgroundColor: isSelected ? FILTER_SELECTED_BACKGROUND : theme.backgroundElement,
              },
            ]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            // 両軸とも先頭に「全て」があり本番4言語で同一文言のため、行単体だと
            // スクリーンリーダーで区別できない。セクション名を前置して一意にする。
            accessibilityLabel={`${label} ${option.label}`}
          >
            <ThemedText
              style={[styles.rowLabel, isSelected ? { color: FILTER_SELECTED_COLOR } : undefined]}
            >
              {option.label}
            </ThemedText>
            {isSelected ? (
              <SymbolView
                tintColor={FILTER_SELECTED_COLOR}
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
  );
}

/**
 * マナー一覧の絞り込みモーダル。ヘッダーの「絞り込み」ボタンから開く。
 *
 * カテゴリー（種別）と対象（地域スコープ）の2軸を、選択中の状態が一目で分かる
 * 行リストで表示する。各軸は単一選択で、先頭の「すべて」で解除できる。選択は
 * `useKindFilterStore` / `useScopeFilterStore` に即時反映され、背後の一覧に反映される。
 */
export function MannerFilterModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedKind, setSelectedKind } = useKindFilterStore();
  const { selectedScope, setSelectedScope } = useScopeFilterStore();

  const kindOptions = KINDS.map((kind) => ({
    value: kind,
    label: t(`manner.kindFilter.${kind}`),
  }));
  const scopeOptions = SCOPES.map((scope) => ({
    value: scope,
    label: t(`manner.scopeFilter.${scope}`),
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* 暗幕のタップで閉じる。シート内のタップは下の Pressable が吸収して閉じないようにする。 */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}}>
          <ThemedView type="background" style={styles.sheet}>
            <View style={[styles.headerRow, { paddingTop: insets.top + Spacing.three }]}>
              <ThemedText type="subtitle">{t('manner.filter.title')}</ThemedText>
              <Pressable
                style={[styles.closeButton, { backgroundColor: theme.backgroundElement }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t('manner.filter.close')}
              >
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={16}
                />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
              <FilterSection
                label={t('manner.filter.category')}
                options={kindOptions}
                selected={selectedKind}
                onSelect={setSelectedKind}
              />
              <FilterSection
                label={t('manner.filter.target')}
                options={scopeOptions}
                selected={selectedScope}
                onSelect={setSelectedScope}
              />
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
