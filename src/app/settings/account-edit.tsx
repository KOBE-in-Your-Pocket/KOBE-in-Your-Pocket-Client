import { Redirect } from 'expo-router';

import { AccountEditScreen } from '@/features/user';
import { IS_USER_CONTENT_ENABLED } from '@/shared/config';
import { useIsAdult } from '@/shared/store';

/**
 * アカウント編集のルート（`/settings/account-edit`）。
 *
 * app 層はルーティングのみを担う薄いシェル。画面の中身は user feature の
 * {@link AccountEditScreen} が持つ。
 *
 * v1 はアカウント機能を出さない（#306）。18歳未満にも出さない。設定画面からの導線は
 * どちらの場合も消えているが、URL スキーム経由では到達できてしまうためここでも塞ぐ。
 */
export default function AccountEditRoute() {
  const isAdult = useIsAdult();

  if (!IS_USER_CONTENT_ENABLED || !isAdult) {
    return <Redirect href="/(tabs)/settings" />;
  }

  return <AccountEditScreen />;
}
