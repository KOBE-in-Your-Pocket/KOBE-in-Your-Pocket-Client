import { ROUTING_ATTRIBUTIONS } from '@/features/legal';
import { ThemedText } from '@/shared/ui';

import { styles } from '../styles/map-screen.styles';

/**
 * 経路を描画しているときに地図へ重ねる帰属表示。
 *
 * 経路は OpenRouteService 経由の OpenStreetMap 由来データで、ODbL は成果物への
 * 帰属表示を求める。設定 → クレジットにも恒久的な表示があるが、データを実際に
 * 使っている画面にも出す。ライセンス上そのまま出す文字列のため翻訳しない。
 */
export function RouteAttribution() {
  return (
    <ThemedText type="small" style={styles.attribution} numberOfLines={2}>
      {ROUTING_ATTRIBUTIONS.map((attribution) => attribution.label).join(' | ')}
    </ThemedText>
  );
}
