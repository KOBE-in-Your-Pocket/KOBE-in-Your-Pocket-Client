export type AppMode = 'tourism' | 'evacuation';

/**
 * モード別の選択中カラー（観光=青 / 避難=赤）。
 * 地図・一覧のモードトグル（SegmentedControl）で共通利用し、両画面の見た目を揃える。
 */
export const MODE_SELECTED_COLOR: Record<AppMode, string> = {
  tourism: '#3B82F6',
  evacuation: '#EF4444',
};
