import { create } from 'zustand';

/**
 * 年齢による利用制限の実行時状態。
 *
 * 永続化された同意記録（`features/legal`）から起動時に流し込まれる。状態をここに置くのは
 * `shared/lib/geo` など shared 配下からも参照する必要がある一方、`shared/` から
 * `features/` への依存が禁止されているため（`docs/directory-structure.md` §7）。
 * 表示言語を shared/store が持ち、`features/user` の言語切替が書き込むのと同じ構造。
 */
export type AgeRestrictionState = {
  /**
   * 18歳以上として同意しているか。
   *
   * 既定は false（制限あり）。同意記録を読み終える前に現在地の取得などが走らないよう、
   * 安全側へ倒している。
   */
  isAdult: boolean;
  /** 同意記録から読み取った年齢区分を反映する。 */
  setIsAdult: (isAdult: boolean) => void;
};

export const useAgeRestrictionStore = create<AgeRestrictionState>((set) => ({
  isAdult: false,
  setIsAdult: (isAdult) => set({ isAdult }),
}));

/** 個人情報に関わる機能（現在地・アカウント・レビュー投稿）を使ってよいかを返す。 */
export function useIsAdult(): boolean {
  return useAgeRestrictionStore((state) => state.isAdult);
}
