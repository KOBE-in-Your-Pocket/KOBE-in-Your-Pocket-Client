import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  DISASTER_TYPES,
  type DisasterType,
  type ShelterSuitability,
  type ShelterSuitabilityByDisaster,
} from '../../domain/evacuation-shelter';

import {
  styles,
  SUITABILITY_CHIP_BACKGROUNDS,
  SUITABILITY_COLORS,
} from '../styles/shelter-suitability.styles';
import type { PlatformSymbolName } from '../types';

import { useTheme } from '@/shared/lib/theme';
import { ThemedText } from '@/shared/ui';

/** 表示上の適否。種別の値が無いときは「情報なし」として出し、「対象外」と区別する。 */
type DisplaySuitability = ShelterSuitability | 'unknown';

/**
 * 適否ごとのアイコン。○△× は日本独自の記号で外国人観光客に伝わりにくいため使わない。
 * アイコンだけに頼らないよう、詳細では必ず文言を、カードでは読み上げ用ラベルを添える。
 */
const SUITABILITY_ICONS: Record<DisplaySuitability, PlatformSymbolName> = {
  suitable: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  conditional: {
    ios: 'exclamationmark.triangle.fill',
    android: 'warning',
    web: 'warning',
  },
  unsuitable: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
  'not-applicable': {
    ios: 'minus.circle',
    android: 'do_not_disturb_on',
    web: 'do_not_disturb_on',
  },
  unknown: { ios: 'questionmark.circle', android: 'help', web: 'help' },
};

function toDisplaySuitability(
  suitability: ShelterSuitabilityByDisaster,
  disaster: DisasterType,
): DisplaySuitability {
  return suitability[disaster] ?? 'unknown';
}

function useSuitabilityItems(suitability: ShelterSuitabilityByDisaster) {
  const { t } = useTranslation();
  const theme = useTheme();

  return DISASTER_TYPES.map((disaster) => {
    const value = toDisplaySuitability(suitability, disaster);
    const disasterLabel = t(`evacuation.disasterType.${disaster}`);
    const statusLabel = t(`evacuation.suitability.${value}`);
    return {
      disaster,
      disasterLabel,
      statusLabel,
      accessibilityLabel: t('evacuation.suitability.label', {
        disaster: disasterLabel,
        status: statusLabel,
      }),
      icon: SUITABILITY_ICONS[value],
      color: SUITABILITY_COLORS[value] ?? theme.textSecondary,
      chipBackground: SUITABILITY_CHIP_BACKGROUNDS[value] ?? theme.backgroundElement,
    };
  });
}

/**
 * 詳細画面用。4 種別すべての適否を、アイコンと文言で 1 行ずつ表示する。
 * 適否の情報が 1 種別も無い避難所（`suitability` が undefined）では欄ごと出さない（#493）。
 */
export function ShelterSuitabilityList({
  suitability,
}: {
  suitability: ShelterSuitabilityByDisaster | undefined;
}) {
  if (!suitability) return null;

  return <ShelterSuitabilityListContent suitability={suitability} />;
}

function ShelterSuitabilityListContent({
  suitability,
}: {
  suitability: ShelterSuitabilityByDisaster;
}) {
  const { t } = useTranslation();
  const items = useSuitabilityItems(suitability);

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{t('evacuation.suitability.title')}</ThemedText>
      {items.map((item) => (
        <View
          key={item.disaster}
          style={styles.row}
          accessible
          accessibilityLabel={item.accessibilityLabel}
        >
          <ThemedText type="small" style={styles.rowLabel}>
            {item.disasterLabel}
          </ThemedText>
          <View style={styles.status}>
            <SymbolView tintColor={item.color} name={item.icon} size={16} />
            <ThemedText type="small" style={[styles.statusText, { color: item.color }]}>
              {item.statusLabel}
            </ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * 一覧カード・地図カード用。4 種別を「アイコン＋種別名」の小さなチップで並べる。
 * 読み上げでは「洪水: 利用できる」のように適否の文言まで読む。
 * 適否の情報が 1 種別も無い避難所では何も出さない（#493）。
 */
export function ShelterSuitabilityChips({
  suitability,
}: {
  suitability: ShelterSuitabilityByDisaster | undefined;
}) {
  if (!suitability) return null;

  return <ShelterSuitabilityChipsContent suitability={suitability} />;
}

function ShelterSuitabilityChipsContent({
  suitability,
}: {
  suitability: ShelterSuitabilityByDisaster;
}) {
  const items = useSuitabilityItems(suitability);

  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <View
          key={item.disaster}
          style={[styles.chip, { backgroundColor: item.chipBackground }]}
          accessible
          accessibilityLabel={item.accessibilityLabel}
        >
          <SymbolView tintColor={item.color} name={item.icon} size={14} />
          <ThemedText style={[styles.chipText, { color: item.color }]}>
            {item.disasterLabel}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
