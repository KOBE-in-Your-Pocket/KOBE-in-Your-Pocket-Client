import { Image, type ImageStyle } from 'expo-image';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/shared/lib/theme';

import type { ShelterFacilityCategory } from '../../domain/evacuation-shelter';

/** 施設種別 → プレースホルダ用アイコン（SF Symbol / Material icon）。 */
const FACILITY_CATEGORY_ICONS: Record<
  ShelterFacilityCategory,
  { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }
> = {
  government: { ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' },
  school: { ios: 'graduationcap.fill', android: 'school', web: 'school' },
  park: { ios: 'tree.fill', android: 'park', web: 'park' },
  gymnasium: { ios: 'figure.basketball', android: 'sports_gymnastics', web: 'sports_gymnastics' },
};

type ShelterImageProps = {
  imageUrl: string;
  facilityCategory: ShelterFacilityCategory;
  style: StyleProp<ViewStyle>;
};

/**
 * 避難所画像。imageUrl 未設定・読み込み失敗時はカテゴリアイコンのプレースホルダを表示する
 * （UserAvatar と同じ failedUrl 追跡パターン）。
 */
export function ShelterImage({ imageUrl, facilityCategory, style }: ShelterImageProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const label = t(`evacuation.list.category.${facilityCategory}`);

  if (imageUrl === '' || imageUrl === failedUrl) {
    return (
      <View
        style={[styles.placeholder, style, { backgroundColor: theme.backgroundSelected }]}
        accessible
        accessibilityLabel={label}
      >
        <SymbolView
          name={FACILITY_CATEGORY_ICONS[facilityCategory]}
          tintColor={theme.textSecondary}
          size={32}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style as StyleProp<ImageStyle>}
      contentFit="cover"
      onError={() => setFailedUrl(imageUrl)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
