import { Redirect } from 'expo-router';

import { AccountEditScreen } from '@/features/user';
import { IS_USER_CONTENT_ENABLED } from '@/shared/config';

/**
 * アカウント編集のルート（`/settings/account-edit`）。
 *
 * app 層はルーティングのみを担う薄いシェル。画面の中身は user feature の
 * {@link AccountEditScreen} が持つ。
 *
 * v1 はアカウント機能を出さない（#306）。設定画面からの導線は消えているが、
 * URL スキーム経由では到達できてしまうためここでも塞ぐ。
 */
export default function AccountEditRoute() {
  if (!IS_USER_CONTENT_ENABLED) {
    return <Redirect href="/(tabs)/settings" />;
  }

  return <AccountEditScreen />;
}
