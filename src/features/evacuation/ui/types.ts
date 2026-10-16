import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

/**
 * SymbolView の `name` に渡すプラットフォーム別シンボル名。
 * iOS は SF Symbols、Android / Web は Material Symbols の名前を指定する。
 * 避難所の適否（{@link ShelterSuitabilityList}）と区分バッジ（{@link ShelterTypeBadge}）で共有する。
 */
export type PlatformSymbolName = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
};
