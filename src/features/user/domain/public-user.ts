/**
 * 公開プロフィールとして他者に見えるユーザー情報。
 * レビュー投稿者など、feature 境界をまたいで参照される。
 */
export type PublicUser = {
  /** ユーザーを一意に識別する安定した ID（同名ユーザーの区別に使う）。 */
  id: string;
  /** 表示名。 */
  name: string;
  /** アイコンの画像 URL。 */
  iconUrl: string;
};
