import { ListScreen, useListModeOnTabSwitch } from '@/widgets/list';

/**
 * ホーム画面の避難所ショートカット専用の隠しルート（タブバーには表示されない）。
 * 観光タブと同じ ListScreen を避難モード固定で開く。
 * タブ切り替え時の listMode 制御は {@link useListModeOnTabSwitch} を参照。
 */
export default function EvacuationTabRoute() {
  useListModeOnTabSwitch('evacuation');

  return <ListScreen />;
}
