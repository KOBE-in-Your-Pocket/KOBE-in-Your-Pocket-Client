import { MannerScreen } from '@/features/manner';

/** マナー一覧タブ。一覧はピクトグラム主体の2列グリッドで、タップで詳細（`/manner/[id]`）へ遷移する。 */
export default function MannersRoute() {
  return <MannerScreen />;
}
