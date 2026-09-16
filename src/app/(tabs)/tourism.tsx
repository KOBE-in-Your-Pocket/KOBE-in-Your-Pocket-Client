import { ListScreen, useListModeOnTabSwitch } from '@/widgets/list';

/**
 * 観光タブ・ホーム画面の観光スポットショートカット共通のルート。
 * タブ切り替え時の listMode 制御は {@link useListModeOnTabSwitch} を参照。
 */
export default function TourismTabRoute() {
  useListModeOnTabSwitch('tourism');

  return <ListScreen />;
}
